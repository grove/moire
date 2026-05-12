import { describe, it, expect } from "vitest";
import { lookupPredicate, inferRole } from "./vocabulary-registry";

// Import the raw REGISTRY for duplicate checking
// We access it indirectly by verifying behaviour, but also parse the module source
// for duplicate IRI detection.

// ── lookupPredicate — well-known IRIs ─────────────────────────

describe("lookupPredicate", () => {
  it("returns the correct entry for rdfs:label", () => {
    const entry = lookupPredicate("http://www.w3.org/2000/01/rdf-schema#label");
    expect(entry.role).toBe("labelling");
    expect(entry.badge).toBe("RDFS");
  });

  it("returns the correct entry for skos:broader", () => {
    const entry = lookupPredicate("http://www.w3.org/2004/02/skos/core#broader");
    expect(entry.role).toBe("classifying");
    expect(entry.badge).toBe("SKOS");
  });

  it("returns the correct entry for foaf:knows", () => {
    const entry = lookupPredicate("http://xmlns.com/foaf/0.1/knows");
    expect(entry.role).toBe("relational");
    expect(entry.badge).toBe("FOAF");
  });

  it("returns the correct entry for owl:sameAs (structural)", () => {
    const entry = lookupPredicate("http://www.w3.org/2002/07/owl#sameAs");
    expect(entry.role).toBe("structural");
    expect(entry.badge).toBe("OWL");
  });

  it("returns undefined role fallback for an unknown IRI", () => {
    const entry = lookupPredicate("http://totally-unknown.example/ns#foo");
    // Should not throw; role is inferred heuristically
    expect(entry).toBeDefined();
    expect(entry.role).toBeDefined();
  });

  it("returns undefined badge for a completely unknown namespace", () => {
    const entry = lookupPredicate("http://totally-unknown.example/ns#foo");
    expect(entry.badge).toBeUndefined();
  });
});

// ── inferRole heuristics ───────────────────────────────────────

describe("inferRole", () => {
  it("infers 'labelling' for IRIs with 'label' in local name", () => {
    expect(inferRole("http://example.org/ns#myLabel")).toBe("labelling");
  });

  it("infers 'temporal' for IRIs with 'date' in local name", () => {
    expect(inferRole("http://example.org/ns#createdDate")).toBe("temporal");
  });

  it("infers 'media' for IRIs with 'image' in local name", () => {
    expect(inferRole("http://example.org/ns#thumbnail_image")).toBe("media");
  });

  it("infers 'structural' for OWL namespace IRIs", () => {
    expect(inferRole("http://www.w3.org/2002/07/owl#allValuesFrom")).toBe("structural");
  });

  it("defaults to 'relational' for unknown patterns", () => {
    expect(inferRole("http://example.org/ns#worksFor")).toBe("relational");
  });
});

// ── No duplicate IRIs in registry ─────────────────────────────

describe("vocabulary-registry REGISTRY", () => {
  it("no IRI appears twice in the registry", async () => {
    // Parse the source to find duplicate keys
    // We test this by calling lookupPredicate for a set of known IRIs
    // and verifying consistent results — true duplicate detection via source parsing.
    const knownIRIs = [
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      "http://www.w3.org/2000/01/rdf-schema#label",
      "http://www.w3.org/2002/07/owl#sameAs",
      "http://www.w3.org/2004/02/skos/core#prefLabel",
      "http://purl.org/dc/elements/1.1/title",
      "http://purl.org/dc/terms/title",
      "http://xmlns.com/foaf/0.1/name",
      "http://www.w3.org/ns/prov#wasDerivedFrom",
      "http://schema.org/name",
    ];

    // Each IRI should return a stable, defined role
    const seen = new Map<string, string>();
    for (const iri of knownIRIs) {
      const entry = lookupPredicate(iri);
      expect(entry.role).toBeDefined();
      // Store and verify consistency (same IRI → same role every call)
      if (seen.has(iri)) {
        expect(entry.role).toBe(seen.get(iri));
      } else {
        seen.set(iri, entry.role);
      }
    }

    // Uniqueness check via module source text
    const fs = await import("fs");
    const path = await import("path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "vocabulary-registry.ts"),
      "utf-8",
    );
    // Extract all IRI-like keys from registry object literal
    const iriMatches = [...src.matchAll(/"(https?:\/\/[^"]+)":/g)].map((m) => m[1]);
    const unique = new Set(iriMatches);
    expect(iriMatches.length).toBe(unique.size);
  });
});
