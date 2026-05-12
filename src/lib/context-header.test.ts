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
    entity: (iri) => undefined,
    class_: (iri) => iri.split(/[#/]/).pop() ?? iri,
    predicate: (iri) => iri.split(/[#/]/).pop() ?? iri,
    value: (iri) => undefined,
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

  it("produces '<pred> of <parent header>' when navigationPredicate is set", () => {
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
    expect(result).toContain("affiliatedWith");
    expect(result).toContain("Universities"); // pluralised parent class
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

// ── Recursive two-deep traversal ──────────────────────────────

describe("buildContextHeader — two-deep traversal", () => {
  it("produces the correct composed string for two navigation steps", () => {
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
    // Should read: "locatedIn of affiliatedWith of Researchers"
    expect(result).toContain("locatedIn");
    expect(result).toContain("affiliatedWith");
    expect(result).toContain("Researchers");
  });
});
