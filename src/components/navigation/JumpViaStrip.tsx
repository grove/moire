"use client";

import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCount } from "@/lib/utils";

export function JumpViaStrip() {
  const frame = useNavigationStore((s) => s.current());
  const traverseVia = useNavigationStore((s) => s.traverseVia);
  const browseRelationships = useNavigationStore((s) => s.browseRelationships);
  const getIntrospection = useEndpointStore((s) => s.getIntrospection);

  const graphs = getIntrospection(frame.endpointId);
  const currentGraph = graphs?.find(
    (g) => g.iri === (frame.graphIRI ?? "default"),
  );

  // Get top navigation-candidate predicates
  const navPredicates = currentGraph?.predicates
    .filter((p) => p.isNavigationCandidate)
    .slice(0, 5) ?? [];

  if (navPredicates.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-xs text-muted-foreground cursor-help">Jump via:</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Navigate to the set of entities connected via this relationship</p>
        </TooltipContent>
      </Tooltip>
      {navPredicates.map((pred) => (
        <Tooltip key={pred.iri}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => traverseVia(pred.iri)}
            >
              {pred.label} ({formatCount(pred.objectCount)}→)
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Browse all entities linked via <span className="font-mono">{pred.label}</span></p>
            <p className="font-mono text-xs text-muted-foreground mt-1 break-all">{pred.iri}</p>
          </TooltipContent>
        </Tooltip>
      ))}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={browseRelationships}
          >
            more →
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Browse all relationships in this graph</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
