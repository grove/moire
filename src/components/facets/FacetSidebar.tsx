"use client";

import { useNavigationStore } from "@/stores/navigation-store";
import { useFacetCounts } from "@/hooks/useFacetCounts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { FacetDefinition, FacetValue } from "@/lib/types";

interface Props {
  facetDefs: FacetDefinition[];
}

export function FacetSidebar({ facetDefs }: Props) {
  const frame = useNavigationStore((s) => s.current());
  const clearAllFacets = useNavigationStore((s) => s.clearAllFacets);
  const { data: facetValues } = useFacetCounts(facetDefs);

  const hasActiveFacets = Object.keys(frame.facets).length > 0;

  if (facetDefs.length === 0) {
    return (
      <aside className="w-64 shrink-0" aria-label="Navigation facets">
        <p className="text-xs text-muted-foreground p-2">
          No facets available for this view.
        </p>
      </aside>
    );
  }

  return (
    <aside className="w-64 shrink-0" aria-label="Navigation facets">
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-4 p-2">
          {hasActiveFacets && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={clearAllFacets}
                >
                  Clear all filters
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove all active facet filters and show all entities</p>
              </TooltipContent>
            </Tooltip>
          )}

          {facetDefs.map((facet, idx) => (
            <div key={facet.id}>
              {idx > 0 && <Separator className="mb-3" />}
              <FacetGroup
                facet={facet}
                values={facetValues?.[facet.id] ?? []}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}

function FacetGroup({
  facet,
  values,
}: {
  facet: FacetDefinition;
  values: FacetValue[];
}) {
  const frame = useNavigationStore((s) => s.current());
  const toggleFacet = useNavigationStore((s) => s.toggleFacet);
  const active = frame.facets[facet.id] ?? [];

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
        {facet.label}
      </h3>
      <div className="flex flex-col gap-0.5">
        {values.map((v) => (
          <Tooltip key={v.value}>
            <TooltipTrigger asChild>
              <button
                onClick={() => toggleFacet(facet.id, v.value)}
                disabled={!v.available && !active.includes(v.value)}
                className={cn(
                  "flex items-center justify-between px-2 py-1 rounded text-sm text-left transition-colors w-full",
                  active.includes(v.value)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground",
                  !v.available && !active.includes(v.value) && "opacity-30 cursor-not-allowed",
                )}
              >
                <span className="truncate">{v.label}</span>
                <Badge
                  variant={active.includes(v.value) ? "secondary" : "outline"}
                  className="ml-2 text-[10px] tabular-nums shrink-0"
                >
                  {v.count}
                </Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {active.includes(v.value)
                ? <p>Remove filter: <span className="font-semibold">{v.label}</span></p>
                : <p>Filter to <span className="font-semibold">{v.label}</span> ({v.count} {v.count === 1 ? "match" : "matches"})</p>
              }
            </TooltipContent>
          </Tooltip>
        ))}
        {values.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-1">No values</p>
        )}
      </div>
    </div>
  );
}
