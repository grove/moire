"use client";

import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { Button } from "@/components/ui/button";
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
      <span className="text-xs text-muted-foreground">Jump via:</span>
      {navPredicates.map((pred) => (
        <Button
          key={pred.iri}
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => traverseVia(pred.iri)}
        >
          {pred.label} ({formatCount(pred.objectCount)}→)
        </Button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="text-xs h-7"
        onClick={browseRelationships}
      >
        more →
      </Button>
    </div>
  );
}
