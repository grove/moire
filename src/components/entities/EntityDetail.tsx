"use client";

import useSWR from "swr";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PredicateTable } from "./PredicateTable";
import { shortIRI } from "@/lib/utils";
import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { fetchResourceAnnotations } from "@/app/actions/graph";
import type { EntityNode, ClassSummary, ResourceAnnotation } from "@/lib/types";
import { ChevronRight, Calendar, ExternalLink, Image as ImageIcon } from "lucide-react";

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

      {/* Predicate table — grouped by role */}
      <CardContent>
        <PredicateTable entityIRI={entity.iri} />
      </CardContent>
    </Card>
  );
}

