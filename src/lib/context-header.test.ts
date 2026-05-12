import { describe, it, expect } from "vitest";
import { buildContextHeader } from "./context-header";
import type { LabelCache } from "./context-header";
import type { LensFrame } from "./types";

// ── Helpers ────────────────────────────────────────────────────

const BASE_FRAME: LensFrame = {
  endpointId: "test",
  graphIRI: "http://example.org/graph",
  context: "set",
  focusIRI: "http://example.org/focus",
  focusClass: undefined,
  navigationPredicate: undefined,
  activeLayer: 0,
  facets: {},
};

function makeLabels(overrides: Partial<LabelCache> = {}): LabelCache {
  return {
    graph: (iri) => (iri ? iri.split("/").pop() ?? iri : "Default Graph"),
    entity: (_iri) => undefined,
    class_: (iri) => iri.split(/[#/]/).pop() ?? iri,
    predicate: (iri) => iri.split(/[#/]/).pop() ?? iri,
    value: (_iri) => undefined,
    ...overrides,
  };
}

// ── context = "graphs" ────────────────────────────────────────

describe("buildContextHeader — graphs context", () => {
  it("returns empty string for graphs context", () => {
    const stack: LensFrame[] = [{ ...BASE_FRAME, context: "graphs" }];
    expect(buildContextHeader(stack, 0, makeLabels())).toBe("");
  });
});

// ── context = "types" ─────────────────────────────────────────

describe("buildContextHeader — types context", () => {
  it("returns 'Types in <graph label>'", () => {
    const stack: LensFrame[] = [{ ...BASE_FRAME, context: "types" }];
    const labels = makeLabels({ graph: () => "My Graph" });
    expect(buildContextHeader(stack, 0, labels)).toBe("Types in My Graph");
  });
});

// ── context = "entity" ────────────────────────────────────────

describe("buildContextHeader — entity context", () => {
  it("returns entity label when label is defined", () => {
    const stack: LensFrame[] = [{ ...BASE_FRAME, context: "entity", focusIRI: "http://example.org/e1" }];
    const labels = makeLabels({ entity: () => "Alice" });
    expect(buildContextHeader(stack, 0, labels)).toBe("Alice");
  });

  it("falls back to shortIRI when label is undefined", () => {
    const stack: LensFrame[] = [{ ...BASE_FRAME, context: "entity", focusIRI: "http://example.org/e1" }];
    const labels = makeLabels({ entity: () => undefined });
    const result = buildContextHeader(stack, 0, labels);
    // shortIRI("http://example.org/e1") should at minimum contain "e1"
    expect(result).toContain("e1");
  });
});

// ── context = "set" ───────────────────────────────────────────

describe("buildContextHeader — set context", () => {
  it("returns pluralised class label when no facets", () => {
    const stack: LensFrame[] = [
      { ...BASE_FRAME, context: "set", focusClass: "http://example.org/Researcher", facets: {} },
    ];
    const labels = makeLabels({ class_: () => "Researcher" });
    // pluralise("Researcher") → "Researchers"
    expect(buildContextHeader(stack, 0, labels)).toBe("Researchers");
  });

  it("prepends facet value phrases when facets are active", () => {
    const stack: LensFrame[] = [
      {
        ...BASE_FRAME,
        context: "set",
        focusClass: "http://example.org/Researcher",
        facets: { "http://example.org/country": ["http://example.org/Norway"] },
      },
    ];
    const labels = makeLabels({
      class_: () => "Researcher",
      value: (iri) => (iri.endsWith("Norway") ? "Norway" : undefined),
    });
    const result = buildContextHeader(stack, 0, labels);
    expect(result).toContain("Norway");
    expect(result).toContain("Researchers");
  });

  // ── v0.3.0: navigation predicate with focusClass uses target-class phrase ──

  it("v0.3.0: uses target class plural when focusClass is set and no inverse label", () => {
    const parentFrame: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      focusClass: "http://example.org/University",
      facets: {},
    };
    const childFrame: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      focusClass: "http://example.org/Researcher",
      navigationPredicate: "http://example.org/affiliatedWith",
      facets: {},
    };
    const stack = [parentFrame, childFrame];
    const labels = makeLabels({
      class_: (iri) => (iri.endsWith("University") ? "University" : "Researcher"),
      predicate: () => "affiliatedWith",
    });
    const result = buildContextHeader(stack, 1, labels);
    // v0.3.0: uses focusClass plural → "Researchers for Universities"
    expect(result).toContain("Researchers");
    expect(result).toContain("Universities");
    expect(result).toContain("for");
  });

  it("fallback: uses predicate label when no focusClass and no inverse label", () => {
    const parentFrame: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      focusClass: "http://example.org/University",
      facets: {},
    };
    const childFrame: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      focusClass: undefined,
      navigationPredicate: "http://example.org/affiliatedWith",
      facets: {},
    };
    const stack = [parentFrame, childFrame];
    const labels = makeLabels({
      class_: (iri) => (iri.endsWith("University") ? "University" : "Researcher"),
      predicate: () => "affiliatedWith",
    });
    const result = buildContextHeader(stack, 1, labels);
    // Fallback: "affiliatedWith of Universities"
    expect(result).toContain("affiliatedWith");
    expect(result).toContain("Universities");
    expect(result).toContain("of");
  });
});

// ── context = "relationships" ─────────────────────────────────

describe("buildContextHeader — relationships context", () => {
  it("produces 'Relationships on <parent header>'", () => {
    const parentFrame: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      focusClass: "http://example.org/Researcher",
      facets: {},
    };
    const relFrame: LensFrame = { ...BASE_FRAME, context: "relationships" };
    const stack = [parentFrame, relFrame];
    const labels = makeLabels({ class_: () => "Researcher" });
    const result = buildContextHeader(stack, 1, labels);
    expect(result).toBe("Relationships on Researchers");
  });
});

// ── v0.3.0: inverse label from LabelCache ─────────────────────

describe("buildContextHeader — v0.3.0 inverse label", () => {
  it("uses predicateInverse from LabelCache when provided", () => {
    const parentFrame: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      focusClass: "http://example.org/Researcher",
      facets: {},
    };
    const childFrame: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      navigationPredicate: "http://example.org/affiliatedWith",
      facets: {},
    };
    const stack = [parentFrame, childFrame];
    const labels = makeLabels({
      class_: () => "Researcher",
      predicate: () => "affiliatedWith",
      predicateInverse: () => "Institutions",
    });
    const result = buildContextHeader(stack, 1, labels);
    // Uses explicit inverse label → "Institutions for Researchers"
    expect(result).toBe("Institutions for Researchers");
  });

  it("uses vocabulary registry inverse label for skos:broader", () => {
    const parentFrame: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      focusClass: "http://example.org/Concept",
      facets: {},
    };
    const childFrame: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      navigationPredicate: "http://www.w3.org/2004/02/skos/core#broader",
      facets: {},
    };
    const stack = [parentFrame, childFrame];
    const labels = makeLabels({
      class_: () => "Concept",
      predicate: () => "broader",
    });
    const result = buildContextHeader(stack, 1, labels);
    // Registry inverse for skos:broader → "Broader concepts for Concepts"
    expect(result).toBe("Broader concepts for Concepts");
  });

  it("predicateInverse from LabelCache takes priority over registry", () => {
    const parentFrame: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      focusClass: "http://example.org/Concept",
      facets: {},
    };
    const childFrame: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      navigationPredicate: "http://www.w3.org/2004/02/skos/core#broader",
      facets: {},
    };
    const stack = [parentFrame, childFrame];
    const labels = makeLabels({
      class_: () => "Concept",
      predicate: () => "broader",
      predicateInverse: () => "Parent topics",
    });
    const result = buildContextHeader(stack, 1, labels);
    // Explicit override wins → "Parent topics for Concepts"
    expect(result).toBe("Parent topics for Concepts");
  });

  it("header is truncated to 100 characters when generated phrase is too long", () => {
    const longParent = "A".repeat(90);
    const parentFrame: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      focusClass: "http://example.org/Thing",
      facets: {},
    };
    const childFrame: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      navigationPredicate: "http://www.w3.org/2004/02/skos/core#broader",
      facets: {},
    };
    const stack = [parentFrame, childFrame];
    const labels = makeLabels({
      class_: () => longParent,
      predicate: () => "broader",
    });
    const result = buildContextHeader(stack, 1, labels);
    expect(result.length).toBeLessThanOrEqual(100);
  });
});

// ── Recursive two-deep traversal ──────────────────────────────

describe("buildContextHeader — two-deep traversal", () => {
  it("v0.3.0: uses focusClass phrase for both hops when no inverse labels", () => {
    const frame0: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      focusClass: "http://example.org/Researcher",
      facets: {},
    };
    const frame1: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      focusClass: "http://example.org/University",
      navigationPredicate: "http://example.org/affiliatedWith",
      facets: {},
    };
    const frame2: LensFrame = {
      ...BASE_FRAME,
      context: "set",
      focusClass: "http://example.org/City",
      navigationPredicate: "http://example.org/locatedIn",
      facets: {},
    };
    const stack = [frame0, frame1, frame2];
    const labels = makeLabels({
      class_: (iri) => {
        if (iri.endsWith("Researcher")) return "Researcher";
        if (iri.endsWith("University")) return "University";
        return "City";
      },
      predicate: (iri) => {
        if (iri.endsWith("affiliatedWith")) return "affiliatedWith";
        return "locatedIn";
      },
    });
    const result = buildContextHeader(stack, 2, labels);
    // frame1 header = "Universities for Researchers"
    // frame2 header = "Cities for Universities for Researchers"
    expect(result).toContain("Cities");
    expect(result).toContain("Universities");
    expect(result).toContain("Researchers");
  });
});
