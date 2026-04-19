"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigationStore } from "@/stores/navigation-store";
import { formatCount } from "@/lib/utils";
import type { GraphSummary } from "@/lib/types";

interface Props {
  graph: GraphSummary;
  endpointId: string;
}

export function GraphCard({ graph, endpointId }: Props) {
  const setGraph = useNavigationStore((s) => s.setGraph);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono font-medium truncate" title={graph.iri}>
          {graph.label || graph.iri}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {formatCount(graph.tripleCount)} triples
          {" · "}{graph.predicates.length} predicates
          {" · "}{graph.classes.length} classes
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="flex flex-wrap gap-1">
          {graph.classes.slice(0, 5).map((cls) => (
            <Badge key={cls.iri} variant="secondary" className="text-[10px]">
              {cls.label} ({formatCount(cls.instanceCount)})
            </Badge>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => setGraph(endpointId, graph.iri === "default" ? null : graph.iri)}
        >
          Browse this graph →
        </Button>
      </CardContent>
    </Card>
  );
}
