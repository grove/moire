import { describe, it, expect } from "vitest";
import { shortIRI, pluralise, formatCount } from "./utils";

describe("shortIRI", () => {
  it("returns the local name after the last # or /", () => {
    expect(shortIRI("http://example.org/ns#foo")).toBe("foo");
    expect(shortIRI("http://example.org/path/bar")).toBe("bar");
  });

  it("returns the original string if no # or / found", () => {
    expect(shortIRI("justAString")).toBe("justAString");
  });
});

describe("pluralise", () => {
  it("appends 's' for regular words", () => {
    expect(pluralise("Researcher")).toBe("Researchers");
  });

  it("does not double-append 's' if word already ends with 's'", () => {
    expect(pluralise("Countries")).toBe("Countries");
  });

  it("replaces 'y' with 'ies' for words ending in y", () => {
    expect(pluralise("Country")).toBe("Countries");
  });

  it("returns empty string unchanged", () => {
    expect(pluralise("")).toBe("");
  });
});

describe("formatCount", () => {
  it("formats small numbers as plain locale string", () => {
    expect(formatCount(42)).toBe("42");
  });

  it("formats thousands with K suffix", () => {
    expect(formatCount(2500)).toBe("2.5K");
  });

  it("formats millions with M suffix", () => {
    expect(formatCount(1_500_000)).toBe("1.5M");
  });
});
