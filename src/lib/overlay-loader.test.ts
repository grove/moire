import { describe, it, expect } from "vitest";
import { validateOverlay, applyPredicateOverlay } from "./overlay-loader";
import type { AnnotationOverlay } from "./overlay-loader";
import type { PredicateSummary } from "./types";

// ── Helpers ────────────────────────────────────────────────────

function makePredicate(iri: string, overrides: Partial<PredicateSummary> = {}): PredicateSummary {
  return {
    iri,
    label: iri.split(/[#/]/).pop() ?? iri,
    subjectCount: 10,
    objectCount: 10,
    valueKind: "literal",
    isFacetCandidate: false,
    isNavigationCandidate: false,
    isStructural: false,
    ...overrides,
  };
}

// ── validateOverlay ────────────────────────────────────────────

describe("validateOverlay", () => {
  it("accepts a minimal valid overlay with version 1", () => {
    const result = validateOverlay({ version: 1 });
    expect(result.version).toBe(1);
  });

  it("accepts an overlay with name, predicates, and resources", () => {
    const raw: AnnotationOverlay = {
      version: 1,
      name: "Test overlay",
      predicates: {
        "http://example.org/legacyId": {
          label: "Legacy Record ID",
          description: "Internal identifier.",
          role: "structural",
          hidden: true,
          priority: 100,
        },
      },
      resources: {
        "http://example.org/thing/1": {
          label: "Thing One",
          description: "The first thing.",
          aliases: ["First Thing", "Thing #1"],
        },
      },
    };
    const result = validateOverlay(raw);
    expect(result.name).toBe("Test overlay");
    expect(result.predicates!["http://example.org/legacyId"].label).toBe("Legacy Record ID");
    expect(result.predicates!["http://example.org/legacyId"].hidden).toBe(true);
    expect(result.resources!["http://example.org/thing/1"].aliases).toEqual(["First Thing", "Thing #1"]);
  });

  it("throws when root value is not an object", () => {
    expect(() => validateOverlay("not an object")).toThrow("root value must be a JSON object");
  });

  it("throws when root value is null", () => {
    expect(() => validateOverlay(null)).toThrow("root value must be a JSON object");
  });

  it("throws when root value is an array", () => {
    expect(() => validateOverlay([])).toThrow("root value must be a JSON object");
  });

  it("throws for unsupported schema version", () => {
    expect(() => validateOverlay({ version: 2 })).toThrow('unsupported schema version "2"');
  });

  it("throws for missing version", () => {
    expect(() => validateOverlay({})).toThrow("unsupported schema version");
  });

  it("throws when name is not a string", () => {
    expect(() => validateOverlay({ version: 1, name: 42 })).toThrow('"name" must be a string');
  });

  it("throws when predicates is not an object", () => {
    expect(() => validateOverlay({ version: 1, predicates: "bad" })).toThrow('"predicates" must be an object');
  });

  it("throws when predicates is an array", () => {
    expect(() => validateOverlay({ version: 1, predicates: [] })).toThrow('"predicates" must be an object');
  });

  it("throws when a predicate entry has an invalid role", () => {
    expect(() =>
      validateOverlay({
        version: 1,
        predicates: {
          "http://example.org/p": { role: "invalid-role" },
        },
      })
    ).toThrow('"role" must be one of');
  });

  it("accepts all valid role values", () => {
    const roles = [
      "labelling", "descriptive", "classifying", "relational",
      "temporal", "numeric", "provenance", "structural", "media",
    ];
    for (const role of roles) {
      expect(() =>
        validateOverlay({
          version: 1,
          predicates: { "http://example.org/p": { role } },
        })
      ).not.toThrow();
    }
  });

  it("throws when a predicate entry label is not a string", () => {
    expect(() =>
      validateOverlay({
        version: 1,
        predicates: { "http://example.org/p": { label: 123 } },
      })
    ).toThrow('"label" must be a string');
  });

  it("throws when a predicate entry hidden is not a boolean", () => {
    expect(() =>
      validateOverlay({
        version: 1,
        predicates: { "http://example.org/p": { hidden: "yes" } },
      })
    ).toThrow('"hidden" must be a boolean');
  });

  it("throws when a predicate entry priority is not a number", () => {
    expect(() =>
      validateOverlay({
        version: 1,
        predicates: { "http://example.org/p": { priority: "high" } },
      })
    ).toThrow('"priority" must be a finite number');
  });

  it("throws when resources is not an object", () => {
    expect(() => validateOverlay({ version: 1, resources: "bad" })).toThrow('"resources" must be an object');
  });

  it("throws when a resource entry aliases is not an array of strings", () => {
    expect(() =>
      validateOverlay({
        version: 1,
        resources: { "http://example.org/r": { aliases: [1, 2] } },
      })
    ).toThrow('"aliases" must be an array of strings');
  });
});

// ── applyPredicateOverlay ──────────────────────────────────────

describe("applyPredicateOverlay", () => {
  const IRI_A = "http://example.org/legacyId";
  const IRI_B = "http://example.org/name";

  it("returns predicates unchanged when overlay is null", () => {
    const predicates = [makePredicate(IRI_A)];
    const result = applyPredicateOverlay(predicates, null);
    expect(result).toEqual(predicates);
  });

  it("returns predicates unchanged when overlay has no predicates section", () => {
    const predicates = [makePredicate(IRI_A)];
    const result = applyPredicateOverlay(predicates, { version: 1 });
    expect(result).toEqual(predicates);
  });

  it("applies label override from overlay", () => {
    const predicates = [makePredicate(IRI_A)];
    const overlay: AnnotationOverlay = {
      version: 1,
      predicates: { [IRI_A]: { label: "Legacy Record ID" } },
    };
    const result = applyPredicateOverlay(predicates, overlay);
    expect(result[0].label).toBe("Legacy Record ID");
  });

  it("sets overlaySource=true on patched predicates", () => {
    const predicates = [makePredicate(IRI_A)];
    const overlay: AnnotationOverlay = {
      version: 1,
      predicates: { [IRI_A]: { label: "Patched" } },
    };
    const result = applyPredicateOverlay(predicates, overlay);
    expect(result[0].overlaySource).toBe(true);
  });

  it("does not set overlaySource on predicates not in overlay", () => {
    const predicates = [makePredicate(IRI_B)];
    const overlay: AnnotationOverlay = {
      version: 1,
      predicates: { [IRI_A]: { label: "Patched" } },
    };
    const result = applyPredicateOverlay(predicates, overlay);
    expect(result[0].overlaySource).toBeUndefined();
  });

  it("sets hidden=true for predicates marked hidden in overlay", () => {
    const predicates = [makePredicate(IRI_A)];
    const overlay: AnnotationOverlay = {
      version: 1,
      predicates: { [IRI_A]: { hidden: true } },
    };
    const result = applyPredicateOverlay(predicates, overlay);
    expect(result[0].hidden).toBe(true);
  });

  it("applies role override from overlay", () => {
    const predicates = [makePredicate(IRI_A, { role: "descriptive" })];
    const overlay: AnnotationOverlay = {
      version: 1,
      predicates: { [IRI_A]: { role: "structural" } },
    };
    const result = applyPredicateOverlay(predicates, overlay);
    expect(result[0].role).toBe("structural");
  });

  it("applies inverseLabel override from overlay", () => {
    const predicates = [makePredicate(IRI_A)];
    const overlay: AnnotationOverlay = {
      version: 1,
      predicates: { [IRI_A]: { inverseLabel: "Records identified by" } },
    };
    const result = applyPredicateOverlay(predicates, overlay);
    expect(result[0].inverseLabel).toBe("Records identified by");
  });

  it("applies description override as skosDefinition from overlay", () => {
    const predicates = [makePredicate(IRI_A)];
    const overlay: AnnotationOverlay = {
      version: 1,
      predicates: { [IRI_A]: { description: "Pre-migration system ID." } },
    };
    const result = applyPredicateOverlay(predicates, overlay);
    expect(result[0].skosDefinition).toBe("Pre-migration system ID.");
  });

  it("applies group and priority overrides from overlay", () => {
    const predicates = [makePredicate(IRI_A)];
    const overlay: AnnotationOverlay = {
      version: 1,
      predicates: { [IRI_A]: { group: "Internal IDs", priority: 5 } },
    };
    const result = applyPredicateOverlay(predicates, overlay);
    expect(result[0].overlayGroup).toBe("Internal IDs");
    expect(result[0].overlayPriority).toBe(5);
  });

  it("does not mutate the original predicate objects", () => {
    const original = makePredicate(IRI_A);
    const predicates = [original];
    const overlay: AnnotationOverlay = {
      version: 1,
      predicates: { [IRI_A]: { label: "Changed" } },
    };
    applyPredicateOverlay(predicates, overlay);
    expect(original.label).not.toBe("Changed");
  });

  it("handles multiple predicates, only patching those in the overlay", () => {
    const a = makePredicate(IRI_A, { label: "Original A" });
    const b = makePredicate(IRI_B, { label: "Original B" });
    const overlay: AnnotationOverlay = {
      version: 1,
      predicates: { [IRI_A]: { label: "Patched A" } },
    };
    const result = applyPredicateOverlay([a, b], overlay);
    expect(result[0].label).toBe("Patched A");
    expect(result[1].label).toBe("Original B");
  });
});
