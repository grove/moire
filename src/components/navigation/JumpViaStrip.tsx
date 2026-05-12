"use client";

import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCount } from "@/lib/utils";
import { RoleIcon } from "@/components/navigation/RoleIcon";
import { PredicateTooltipContent } from "@/components/navigation/PredicateTooltip";
import type { RelationshipInfo } from "@/app/actions/graph";

const MAX_JUMP_BUTTONS = 5;

export function JumpViaStrip() {
  const frame = useNavigationStore((s) => s.current());
  const traverseVia = useNavigationStore((s) => s.traverseVia);
  const browseRelationships = useNavigationStore((s) => s.browseRelationships);
  const getIntrospection = useEndpointStore((s) => s.getIntrospection);

  const graphs = getIntrospection(frame.endpointId);
  const currentGraph = graphs?.find(
    (g) => g.iri === (frame.graphIRI ?? "default"),
  );

  // Get all navigation-candidate predicates, sorted by usefulness descending
  const navPredicates = (currentGraph?.predicates ?? [])
    .filter((p) => p.isNavigationCandidate)
    .sort((a, b) => (b.usefulness ?? 0) - (a.usefulness ?? 0))
    .slice(0, MAX_JUMP_BUTTONS);

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
      {navPredicates.map((pred) => {
        // Build a RelationshipInfo-compatible object from PredicateSummary
        const rel: RelationshipInfo = {
          predicate: pred.iri,
          label: pred.label,
          subjectCount: pred.subjectCount,
          objectCount: pred.objectCount,
          valueKind: pred.valueKind,
          isNavigationCandidate: pred.isNavigationCandidate,
          role: pred.role,
          vocabularyBadge: pred.vocabularyBadge,
          cardinality: pred.cardinality,
          usefulness: pred.usefulness,
        };
        return (
          <Tooltip key={pred.iri}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={() => traverseVia(pred.iri)}
                aria-label={`Jump via ${pred.label}`}
              >
                <RoleIcon role={pred.role} />
                {pred.label} ({formatCount(pred.objectCount)}→)
              </Button>
            </TooltipTrigger>
            <TooltipContent className="p-3">
              <PredicateTooltipContent
                rel={rel}
                endpointId={frame.endpointId}
                graphIRI={frame.graphIRI}
                classIRI={frame.focusClass}
              />
            </TooltipContent>
          </Tooltip>
        );
      })}
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

