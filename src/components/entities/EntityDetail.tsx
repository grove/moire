"use client";

import useSWR from "swr";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PredicateTable } from "./PredicateTable";
import { shortIRI } from "@/lib/utils";
import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { fetchResourceAnnotations, fetchEntityPredicates, fetchShaclShapes, fetchSimilarEntities, fetchPgRippleShaclViolations } from "@/app/actions/graph";
import { computeShaclViolations } from "@/lib/metadata-queries";
import type { EntityNode, ClassSummary, ResourceAnnotation, SearchResult } from "@/lib/types";
import { ChevronRight, Calendar, ExternalLink, Image as ImageIcon, AlertTriangle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface Props {
  entity: EntityNode;
}

/** Walk up the superClass chain in the class summary list. */
function buildTypeHierarchy(
  typeIRI: string | undefined,
  classes: ClassSummary[],
): Array<{ iri: string; label: string }> {
  if (!typeIRI) return [];
  const hierarchy: Array<{ iri: string; label: string }> = [];
  const seen = new Set<string>();
  let current: string | undefined = typeIRI;
  while (current && !seen.has(current)) {
    seen.add(current);
    const cls = classes.find((c) => c.iri === current);
    if (cls) {
      hierarchy.push({ iri: cls.iri, label: cls.label });
      current = cls.superClass;
    } else {
      hierarchy.push({ iri: current, label: shortIRI(current) });
      break;
    }
  }
  return hierarchy;
}

/** Format an ISO date/datetime string to a readable short form. */
function formatDate(value: string): string {
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return value;
  }
}

export function EntityDetail({ entity }: Props) {
  const frame = useNavigationStore((s) => s.current());
  const getEndpoint = useEndpointStore((s) => s.getEndpoint);
  const getIntrospection = useEndpointStore((s) => s.getIntrospection);

  const endpoint = frame.endpointId ? getEndpoint(frame.endpointId) : undefined;
  const isPgRipple = endpoint?.capabilities?.isPgRipple ?? false;
  const hasVectorSearch = endpoint?.capabilities?.vectorSearch ?? false;
  const hasShaclValidation = endpoint?.capabilities?.shaclValidation ?? false;

  // Type hierarchy from cached graph summary — no extra query needed
  const graphs = getIntrospection(frame.endpointId);
  const currentGraph = graphs?.find((g) => g.iri === (frame.graphIRI ?? "default"));
  const typeHierarchy = buildTypeHierarchy(entity.type, currentGraph?.classes ?? []);

  // On-demand annotations — runs after initial render (non-blocking)
  const annotationKey = endpoint
    ? `annotation:${frame.endpointId}:${frame.graphIRI}:${entity.iri}`
    : null;
  const { data: annotation } = useSWR<ResourceAnnotation>(
    annotationKey,
    async () => {
      if (!endpoint) return {};
      return fetchResourceAnnotations(
        endpoint.sparqlUrl,
        entity.iri,
        frame.graphIRI,
        endpoint.auth,
      );
    },
    { revalidateOnFocus: false },
  );

  // v0.7.0 — SHACL shapes for entity type (only for non-pg-ripple; pg-ripple uses pre-computed results)
  const { data: shaclShapes = [] } = useSWR(
    endpoint && entity.type && !isPgRipple
      ? `shacl-shapes:${frame.endpointId}:${frame.graphIRI}:${entity.type}`
      : null,
    async () => {
      if (!endpoint || !entity.type) return [];
      return fetchShaclShapes(endpoint.sparqlUrl, entity.type, frame.graphIRI, endpoint.auth);
    },
    { revalidateOnFocus: false },
  );

  // v0.7.0 — Entity predicates for violation checking (same SWR key as PredicateTable → no extra request)
  const predicateKey = endpoint
    ? `predicates:${frame.endpointId}:${frame.graphIRI}:${entity.iri}`
    : null;
  const { data: predicateRows = [] } = useSWR(
    predicateKey,
    async () => {
      if (!endpoint) return [];
      return fetchEntityPredicates(endpoint.sparqlUrl, entity.iri, frame.graphIRI, endpoint.auth);
    },
    { revalidateOnFocus: false },
  );

  // v0.9.0 — pg-ripple: pre-computed SHACL violations (only for pg-ripple with shaclValidation)
  const { data: pgRippleViolations = [] } = useSWR(
    isPgRipple && hasShaclValidation && endpoint
      ? `pg-ripple-shacl:${frame.endpointId}:${frame.graphIRI}:${entity.iri}`
      : null,
    async () => {
      if (!endpoint) return [];
      return fetchPgRippleShaclViolations(
        endpoint.sparqlUrl,
        entity.iri,
        frame.graphIRI,
        endpoint.auth,
      );
    },
    { revalidateOnFocus: false },
  );

  // Derive SHACL violations: use pg-ripple pre-computed for pg-ripple, computed locally otherwise
  const entityPredicateIRIs = predicateRows.map((r) => r.predicate);
  const shaclViolations = isPgRipple
    ? pgRippleViolations
    : computeShaclViolations(shaclShapes, entityPredicateIRIs);

  // v0.9.0 — pg-ripple: semantically similar entities (only when vector index is available)
  const { data: similarEntities } = useSWR<SearchResult[]>(
    isPgRipple && hasVectorSearch && endpoint
      ? `similar:${frame.endpointId}:${frame.graphIRI}:${entity.iri}`
      : null,
    async () => {
      if (!endpoint) return [];
      return fetchSimilarEntities(
        endpoint.sparqlUrl,
        entity.iri,
        frame.graphIRI,
        endpoint.labelPredicate,
        10,
        endpoint.auth,
      );
    },
    { revalidateOnFocus: false },
  );

  // Collapsible state for the SHACL panel
  const [shaclExpanded, setShaclExpanded] = useState(false);
  // Navigation helper for similar entities
  const pushFocus = useNavigationStore((s) => s.pushFocus);

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {entity.label}
        </CardTitle>
        <p className="text-xs text-muted-foreground font-mono break-all">
          {entity.iri}
        </p>

        {/* Type hierarchy */}
        {typeHierarchy.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-0.5 mt-1"
            data-testid="entity-type-hierarchy"
            aria-label="Type hierarchy"
          >
            {typeHierarchy.map((t, i) => (
              <span key={t.iri} className="flex items-center gap-0.5">
                {i > 0 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden />
                )}
                <Badge variant={i === 0 ? "secondary" : "outline"} className="text-xs">
                  {t.label}
                </Badge>
              </span>
            ))}
          </div>
        )}

        {/* Fallback: single type badge when no hierarchy */}
        {typeHierarchy.length === 0 && entity.type && (
          <Badge variant="secondary" className="w-fit text-xs">
            {shortIRI(entity.type)}
          </Badge>
        )}

        {/* Source / Provenance — hoisted to header */}
        {annotation?.sourceUrl && (
          <div data-testid="entity-source" className="mt-1">
            <a
              href={annotation.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" aria-hidden />
              Source
            </a>
          </div>
        )}
      </CardHeader>

      {/* Abstract / description from entity data */}
      {entity.abstract && (
        <CardContent>
          <p className="text-base leading-relaxed text-foreground">{entity.abstract}</p>
        </CardContent>
      )}

      {/* Annotation sections — appear after initial render */}

      {/* Also known as */}
      {annotation?.aliases && annotation.aliases.length > 0 && (
        <CardContent data-testid="entity-aliases">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Also known as
          </p>
          <div className="flex flex-wrap gap-1">
            {annotation.aliases.slice(0, 5).map((alias, i) => (
              <Badge key={i} variant="outline" className="text-xs font-normal">
                {alias}
              </Badge>
            ))}
            {annotation.aliases.length > 5 && (
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                +{annotation.aliases.length - 5} more
              </Badge>
            )}
          </div>
        </CardContent>
      )}

      {/* Temporal */}
      {annotation?.temporalInfo &&
        (annotation.temporalInfo.created ||
          annotation.temporalInfo.modified ||
          annotation.temporalInfo.generatedAt) && (
          <CardContent data-testid="entity-temporal">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Dates
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {annotation.temporalInfo.created && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" aria-hidden />
                  Created {formatDate(annotation.temporalInfo.created)}
                </span>
              )}
              {annotation.temporalInfo.modified && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" aria-hidden />
                  Modified {formatDate(annotation.temporalInfo.modified)}
                </span>
              )}
              {annotation.temporalInfo.generatedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" aria-hidden />
                  Generated {formatDate(annotation.temporalInfo.generatedAt)}
                </span>
              )}
            </div>
          </CardContent>
        )}

      {/* Media */}
      {annotation?.media && annotation.media.length > 0 && (
        <CardContent data-testid="entity-media">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Media
          </p>
          <div className="flex flex-wrap gap-2">
            {annotation.media.map((m, i) => (
              <a
                key={i}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {m.kind === "image" ? (
                  <ImageIcon className="h-3 w-3" aria-hidden />
                ) : (
                  <ExternalLink className="h-3 w-3" aria-hidden />
                )}
                {m.kind === "image" ? "Image" : m.kind === "page" ? "Page" : "Document"}
              </a>
            ))}
          </div>
        </CardContent>
      )}

      {/* v0.7.0 — SHACL data quality panel (quiet, collapsible) */}
      {shaclViolations.length > 0 && (
        <CardContent data-testid="shacl-violations">
          <div className="border border-amber-200 bg-amber-50 rounded-md overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-amber-100 transition-colors"
              onClick={() => setShaclExpanded((prev) => !prev)}
              aria-expanded={shaclExpanded}
              aria-controls="shacl-violations-list"
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                Data Quality ({shaclViolations.length}{" "}
                {shaclViolations.length === 1 ? "issue" : "issues"})
              </span>
              {shaclExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-amber-600" aria-hidden />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-amber-600" aria-hidden />
              )}
            </button>

            {shaclExpanded && (
              <ul
                id="shacl-violations-list"
                className="px-3 pb-3 pt-1 space-y-1.5"
                role="list"
                aria-label="SHACL data quality violations"
              >
                {shaclViolations.map((v, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-300 text-amber-700 bg-white flex-shrink-0 mt-0.5"
                    >
                      {v.severity}
                    </Badge>
                    <span>{v.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      )}

      {/* Predicate table — grouped by role */}
      <CardContent>
        <PredicateTable entityIRI={entity.iri} />
      </CardContent>

      {/* v0.9.0 — pg-ripple: Semantically similar entities (only when vector index built) */}
      {isPgRipple && similarEntities && similarEntities.length > 0 && (
        <CardContent data-testid="similar-entities">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" aria-hidden />
            Semantically similar
          </p>
          <ul className="space-y-1" role="list" aria-label="Semantically similar entities">
            {similarEntities.map((result) => (
              <li key={result.iri}>
                <button
                  type="button"
                  className="w-full text-left flex items-center justify-between gap-2 rounded px-2 py-1 text-sm hover:bg-muted transition-colors"
                  onClick={() => pushFocus(result.iri)}
                >
                  <span className="font-medium truncate">{result.label}</span>
                  {result.typeLabel && (
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">
                      {result.typeLabel}
                    </Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}

