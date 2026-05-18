"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetchRelationships, type RelationshipInfo } from "@/app/actions/graph";
import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { formatCount } from "@/lib/utils";
import { RoleIcon } from "@/components/navigation/RoleIcon";
import { PredicateTooltipContent } from "@/components/navigation/PredicateTooltip";
import type { PredicateRole } from "@/lib/vocabulary-registry";
import { Eye, EyeOff } from "lucide-react";

// ── Role → UI section mapping ──────────────────────────────────

interface Section {
  heading: string;
  description: string;
  roles: PredicateRole[];
}

const SECTIONS: Section[] = [
  {
    heading: "Explore",
    description: "Follow these relationships to navigate to connected entities.",
    roles: ["relational"],
  },
  {
    heading: "Filter",
    description: "Use these to filter or classify the current set.",
    roles: ["classifying"],
  },
  {
    heading: "Describe",
    description: "Labels, descriptions, dates, and numeric properties.",
    roles: ["labelling", "descriptive", "temporal", "numeric"],
  },
  {
    heading: "Source",
    description: "Provenance, media, and external links.",
    roles: ["provenance", "media"],
  },
  {
    heading: "Technical",
    description: "Structural and schema-level predicates.",
    roles: ["structural"],
  },
];

// Fallback section for predicates without a recognised role
const FALLBACK_SECTION = "Describe";

function getSectionHeading(role: PredicateRole | undefined): string {
  if (!role) return FALLBACK_SECTION;
  for (const s of SECTIONS) {
    if ((s.roles as string[]).includes(role)) return s.heading;
  }
  return FALLBACK_SECTION;
}

// ── Component ─────────────────────────────────────────────────

export function RelationshipsBrowser() {
  const frame = useNavigationStore((s) => s.current());
  const traverseVia = useNavigationStore((s) => s.traverseVia);
  const getEndpoint = useEndpointStore((s) => s.getEndpoint);
  const getIntrospection = useEndpointStore((s) => s.getIntrospection);

  // v0.10.0 — technical view toggle
  const [showTechnical, setShowTechnical] = useState(false);

  const key = frame.endpointId
    ? `relationships:${frame.endpointId}:${frame.graphIRI}:${frame.focusClass ?? "all"}`
    : null;

  const { data: relationships, isLoading } = useSWR<RelationshipInfo[]>(
    key,
    async () => {
      const endpoint = getEndpoint(frame.endpointId);
      if (!endpoint) return [];
      // Pass introspected predicates to enrich with v0.4 metadata (domain/range/inverse/owl)
      const summaries = getIntrospection(frame.endpointId);
      const graphSummary = summaries?.find(
        (s) => s.iri === (frame.graphIRI ?? "default"),
      );
      const predicateSummaries = graphSummary?.predicates;
      return fetchRelationships(
        endpoint.sparqlUrl,
        frame.graphIRI,
        frame.focusClass,
        endpoint.auth,
        predicateSummaries,
      );
    },
    { revalidateOnFocus: false },
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!relationships || relationships.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No relationships found.
      </p>
    );
  }

  // Group relationships into sections, sorted by usefulness within each group
  const visibleRelationships = showTechnical
    ? relationships
    : relationships.filter((r) => !r.hidden);

  const hiddenCount = relationships.length - visibleRelationships.length;

  const grouped = new Map<string, RelationshipInfo[]>();
  for (const rel of visibleRelationships) {
    const heading = getSectionHeading(rel.role);
    if (!grouped.has(heading)) grouped.set(heading, []);
    grouped.get(heading)!.push(rel);
  }

  // Sort within each group by usefulness descending
  for (const items of grouped.values()) {
    items.sort((a, b) => (b.usefulness ?? 0) - (a.usefulness ?? 0));
  }

  // Render sections in canonical order (only those that have data)
  const orderedHeadings = SECTIONS.map((s) => s.heading).filter((h) => grouped.has(h));

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Relationships on the current {frame.focusClass ? "set" : "graph"}
          </p>
          {/* v0.10.0 — technical view toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 text-xs gap-1 ${showTechnical ? "text-primary" : "text-muted-foreground"}`}
                onClick={() => setShowTechnical((v) => !v)}
                data-testid="technical-view-toggle"
                aria-pressed={showTechnical}
              >
                {showTechnical ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                Technical
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showTechnical
                ? "Hide technical predicates and show overlay-curated labels"
                : `Show technical view with raw IRIs and ${hiddenCount > 0 ? `${hiddenCount} hidden predicate${hiddenCount !== 1 ? "s" : ""}` : "all predicates"}`}
            </TooltipContent>
          </Tooltip>
        </div>

        {orderedHeadings.map((heading, idx) => {
          const section = SECTIONS.find((s) => s.heading === heading)!;
          const items = grouped.get(heading)!;
          const navItems = items.filter((r) => r.isNavigationCandidate);
          const otherItems = items.filter((r) => !r.isNavigationCandidate);

          return (
            <div key={heading} className="space-y-1">
              {idx > 0 && <Separator />}
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground cursor-help">
                    {heading}
                  </h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{section.description}</p>
                </TooltipContent>
              </Tooltip>

              {navItems.map((rel) => (
                <RelationshipRow
                  key={rel.predicate}
                  rel={rel}
                  onFollow={() => traverseVia(rel.predicate)}
                  showFollow
                  showTechnical={showTechnical}
                  endpointId={frame.endpointId}
                  graphIRI={frame.graphIRI}
                  classIRI={frame.focusClass}
                />
              ))}
              {otherItems.map((rel) => (
                <RelationshipRow
                  key={rel.predicate}
                  rel={rel}
                  onFollow={() => traverseVia(rel.predicate)}
                  showFollow={false}
                  showTechnical={showTechnical}
                  endpointId={frame.endpointId}
                  graphIRI={frame.graphIRI}
                  classIRI={frame.focusClass}
                />
              ))}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

function CardinalityIndicator({ cardinality }: { cardinality?: RelationshipInfo["cardinality"] }) {
  if (!cardinality) return null;
  const labels: Record<string, string> = {
    "single": "1",
    "usually-single": "~1",
    "multi": "1+",
    "highly-multi": "N",
  };
  return (
    <span className="text-[10px] text-muted-foreground font-mono" title={cardinality}>
      {labels[cardinality] ?? ""}
    </span>
  );
}

function RelationshipRow({
  rel,
  onFollow,
  showFollow,
  showTechnical,
  endpointId,
  graphIRI,
  classIRI,
}: {
  rel: RelationshipInfo;
  onFollow: () => void;
  showFollow: boolean;
  showTechnical: boolean;
  endpointId: string;
  graphIRI: string | null;
  classIRI: string | undefined;
}) {
  return (
    <div className={`flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors group ${rel.hidden ? "opacity-60" : ""}`} data-testid="relationship-row">
      <div className="flex items-start gap-2 min-w-0 flex-1">
        {/* Role icon — visually distinct, accessible */}
        <RoleIcon role={rel.role} className="mt-0.5 shrink-0" />

        <div className="min-w-0 flex-1">
          {/* Primary row: label + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <CardinalityIndicator cardinality={rel.cardinality} />

            {/* Predicate label with rich tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-mono text-xs cursor-help truncate">{rel.label}</span>
              </TooltipTrigger>
              <TooltipContent className="p-3">
                <PredicateTooltipContent
                  rel={rel}
                  endpointId={endpointId}
                  graphIRI={graphIRI}
                  classIRI={classIRI}
                />
              </TooltipContent>
            </Tooltip>

            {rel.vocabularyBadge && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0">
                {rel.vocabularyBadge}
              </Badge>
            )}

            {/* v0.10.0 — overlay source marker (technical view only) */}
            {showTechnical && rel.overlaySource && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                overlay
              </Badge>
            )}

            {/* v0.10.0 — hidden marker (technical view only) */}
            {showTechnical && rel.hidden && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 shrink-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                hidden
              </Badge>
            )}

            {/* Inverse label badge — v0.5.0 */}
            {rel.inverseLabel && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 shrink-0" title={`Inverse: ${rel.inverseLabel}`}>
                ↔ {rel.inverseLabel}
              </Badge>
            )}

            {/* Coverage percentage — v0.5.0 */}
            {rel.coveragePercent !== undefined && (
              <span className="text-[10px] text-muted-foreground shrink-0" data-testid="coverage-percent">
                {rel.coveragePercent}%
              </span>
            )}
          </div>

          {/* Secondary row: domain/range — v0.5.0 */}
          {(rel.domainLabel || rel.rangeLabel) && (
            <p className="text-[10px] text-muted-foreground mt-0.5" data-testid="domain-range-text">
              {rel.domainLabel && (
                <span>Usually describes: <span className="font-medium">{rel.domainLabel}</span></span>
              )}
              {rel.domainLabel && rel.rangeLabel && <span> · </span>}
              {rel.rangeLabel && (
                <span>Usually points to: <span className="font-medium">{rel.rangeLabel}</span></span>
              )}
            </p>
          )}

          {/* Count info */}
          <p className="text-[10px] text-muted-foreground">
            {formatCount(rel.subjectCount)} subj → {formatCount(rel.objectCount)} obj
          </p>

          {/* v0.10.0 — raw IRI shown in technical view */}
          {showTechnical && (
            <p className="text-[10px] text-muted-foreground font-mono break-all mt-0.5">
              {rel.predicate}
            </p>
          )}
        </div>
      </div>
      {showFollow && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onFollow}
          className="text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
        >
          Follow as set →
        </Button>
      )}
    </div>
  );
}

