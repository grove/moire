/**
 * v0.10.0 — Local Annotation Overlays
 *
 * Loads and validates a JSON overlay file that lets endpoint owners customise
 * predicate and resource annotations without modifying the underlying RDF data.
 *
 * Design goals:
 *  - Overlays are the final annotation pass: they override everything else.
 *  - Hidden predicates are invisible by default; the technical view restores them.
 *  - Overlay-sourced fields are tagged so the technical view can display them.
 *  - Invalid overlay files fail with a clear, actionable error message.
 */

import type { PredicateSummary } from "./types";
import type { PredicateRole } from "./vocabulary-registry";

// ── Overlay schema types ─────────────────────────────────────────────────────

/** Allowed predicate roles in an overlay (mirrors vocabulary-registry.ts). */
export type OverlayRole = PredicateRole;

/** Per-predicate overrides in the overlay file. */
export interface OverlayPredicateEntry {
  /** Human-readable label override. */
  label?: string;
  /** Inverse label (what you get when you navigate via this predicate). */
  inverseLabel?: string;
  /** Plain-text description shown in tooltips. */
  description?: string;
  /** Semantic role; overrides heuristic and registry. */
  role?: OverlayRole;
  /** Display group name (shown in Relationships Browser). */
  group?: string;
  /** When true, the predicate is hidden from normal view. */
  hidden?: boolean;
  /** Icon identifier (for future use). */
  icon?: string;
  /** Display priority — lower values appear first (0 = highest). */
  priority?: number;
}

/** Per-resource overrides in the overlay file. */
export interface OverlayResourceEntry {
  /** Label override. */
  label?: string;
  /** Description override. */
  description?: string;
  /** Icon identifier (for future use). */
  icon?: string;
  /** Additional aliases / alternate names. */
  aliases?: string[];
}

/** The root overlay document structure. */
export interface AnnotationOverlay {
  /** Schema version — currently must be 1. */
  version: 1;
  /** Optional human-readable name for this overlay. */
  name?: string;
  /** Predicate overrides keyed by full IRI. */
  predicates?: Record<string, OverlayPredicateEntry>;
  /** Resource overrides keyed by full IRI. */
  resources?: Record<string, OverlayResourceEntry>;
}

// ── Validation ───────────────────────────────────────────────────────────────

const VALID_ROLES: ReadonlySet<string> = new Set<OverlayRole>([
  "labelling",
  "descriptive",
  "classifying",
  "relational",
  "temporal",
  "numeric",
  "provenance",
  "structural",
  "media",
]);

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function validatePredicateEntry(entry: unknown, iri: string): OverlayPredicateEntry {
  if (!isRecord(entry)) {
    throw new Error(`Overlay: predicate entry for <${iri}> must be an object.`);
  }

  const e = entry as Record<string, unknown>;

  if ("label" in e && typeof e.label !== "string") {
    throw new Error(`Overlay: predicate <${iri}> "label" must be a string.`);
  }
  if ("inverseLabel" in e && typeof e.inverseLabel !== "string") {
    throw new Error(`Overlay: predicate <${iri}> "inverseLabel" must be a string.`);
  }
  if ("description" in e && typeof e.description !== "string") {
    throw new Error(`Overlay: predicate <${iri}> "description" must be a string.`);
  }
  if ("role" in e && !VALID_ROLES.has(e.role as string)) {
    throw new Error(
      `Overlay: predicate <${iri}> "role" must be one of: ${[...VALID_ROLES].join(", ")}.`
    );
  }
  if ("group" in e && typeof e.group !== "string") {
    throw new Error(`Overlay: predicate <${iri}> "group" must be a string.`);
  }
  if ("hidden" in e && typeof e.hidden !== "boolean") {
    throw new Error(`Overlay: predicate <${iri}> "hidden" must be a boolean.`);
  }
  if ("icon" in e && typeof e.icon !== "string") {
    throw new Error(`Overlay: predicate <${iri}> "icon" must be a string.`);
  }
  if ("priority" in e) {
    if (typeof e.priority !== "number" || !Number.isFinite(e.priority)) {
      throw new Error(`Overlay: predicate <${iri}> "priority" must be a finite number.`);
    }
  }

  return e as OverlayPredicateEntry;
}

function validateResourceEntry(entry: unknown, iri: string): OverlayResourceEntry {
  if (!isRecord(entry)) {
    throw new Error(`Overlay: resource entry for <${iri}> must be an object.`);
  }

  const e = entry as Record<string, unknown>;

  if ("label" in e && typeof e.label !== "string") {
    throw new Error(`Overlay: resource <${iri}> "label" must be a string.`);
  }
  if ("description" in e && typeof e.description !== "string") {
    throw new Error(`Overlay: resource <${iri}> "description" must be a string.`);
  }
  if ("icon" in e && typeof e.icon !== "string") {
    throw new Error(`Overlay: resource <${iri}> "icon" must be a string.`);
  }
  if ("aliases" in e) {
    if (!Array.isArray(e.aliases) || !e.aliases.every((a) => typeof a === "string")) {
      throw new Error(`Overlay: resource <${iri}> "aliases" must be an array of strings.`);
    }
  }

  return e as OverlayResourceEntry;
}

/**
 * Validate a raw parsed JSON value as an `AnnotationOverlay`.
 * Throws a descriptive `Error` if the document fails validation.
 * Returns the typed overlay on success.
 */
export function validateOverlay(raw: unknown): AnnotationOverlay {
  if (!isRecord(raw)) {
    throw new Error("Overlay: root value must be a JSON object.");
  }

  const doc = raw as Record<string, unknown>;

  // version
  if (doc.version !== 1) {
    throw new Error(
      `Overlay: unsupported schema version "${doc.version}". Only version 1 is supported.`
    );
  }

  // name (optional)
  if ("name" in doc && typeof doc.name !== "string") {
    throw new Error('Overlay: "name" must be a string.');
  }

  // predicates (optional)
  if ("predicates" in doc) {
    if (!isRecord(doc.predicates)) {
      throw new Error('Overlay: "predicates" must be an object.');
    }
    for (const [iri, entry] of Object.entries(doc.predicates as Record<string, unknown>)) {
      validatePredicateEntry(entry, iri);
    }
  }

  // resources (optional)
  if ("resources" in doc) {
    if (!isRecord(doc.resources)) {
      throw new Error('Overlay: "resources" must be an object.');
    }
    for (const [iri, entry] of Object.entries(doc.resources as Record<string, unknown>)) {
      validateResourceEntry(entry, iri);
    }
  }

  return doc as unknown as AnnotationOverlay;
}

// ── Overlay fetch ────────────────────────────────────────────────────────────

/**
 * Fetch, parse, and validate an overlay from the given URL.
 * Returns `null` when the URL is empty/undefined (no overlay configured).
 * Throws a descriptive `Error` on network failure or validation failure.
 */
export async function loadOverlay(overlayUrl: string | undefined): Promise<AnnotationOverlay | null> {
  if (!overlayUrl?.trim()) return null;

  let response: Response;
  try {
    response = await fetch(overlayUrl);
  } catch (err) {
    throw new Error(
      `Overlay: failed to fetch "${overlayUrl}": ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Overlay: server returned HTTP ${response.status} for "${overlayUrl}".`
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new Error(`Overlay: response from "${overlayUrl}" is not valid JSON.`);
  }

  return validateOverlay(json);
}

// ── Apply overlay ────────────────────────────────────────────────────────────

/**
 * Apply an annotation overlay to a list of predicate summaries.
 *
 * Overlay fields take the highest precedence and override everything else.
 * Predicates not mentioned in the overlay are returned unchanged.
 * A predicate with `hidden: true` in the overlay gets `hidden: true` on its
 * summary (it is filtered out in the UI unless technical view is active).
 */
export function applyPredicateOverlay(
  predicates: PredicateSummary[],
  overlay: AnnotationOverlay | null,
): PredicateSummary[] {
  if (!overlay?.predicates) return predicates;

  return predicates.map((p) => {
    const entry = overlay.predicates![p.iri];
    if (!entry) return p;

    const patched: PredicateSummary = { ...p, overlaySource: true };

    if (entry.label !== undefined) patched.label = entry.label;
    if (entry.inverseLabel !== undefined) patched.inverseLabel = entry.inverseLabel;
    if (entry.description !== undefined) patched.skosDefinition = entry.description;
    if (entry.role !== undefined) patched.role = entry.role;
    if (entry.group !== undefined) patched.overlayGroup = entry.group;
    if (entry.hidden !== undefined) patched.hidden = entry.hidden;
    if (entry.priority !== undefined) patched.overlayPriority = entry.priority;

    return patched;
  });
}
