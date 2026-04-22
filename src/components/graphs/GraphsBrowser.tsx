"use client";

import { useIntrospection } from "@/hooks/useIntrospection";
import { GraphCard } from "./GraphCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCount } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  endpointId: string;
  sparqlUrl: string;
}

export function GraphsBrowser({ endpointId, sparqlUrl }: Props) {
  const { data: graphs, isLoading, mutate } = useIntrospection(endpointId);

  const totalTriples = graphs?.reduce((sum, g) => sum + g.tripleCount, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Endpoint: <span className="font-mono text-xs">{sparqlUrl}</span>
          </p>
          {graphs && (
            <p className="text-sm text-muted-foreground mt-1">
              {graphs.length} {graphs.length === 1 ? "graph" : "named graphs"}
              {" · "}{formatCount(totalTriples)} triples total
            </p>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => mutate()}
              disabled={isLoading}
              className="text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Re-introspect the endpoint to discover new or updated graphs</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {isLoading && !graphs && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      )}

      {graphs && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {graphs.map((graph) => (
            <GraphCard key={graph.iri} graph={graph} endpointId={endpointId} />
          ))}
        </div>
      )}

      {graphs && graphs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No graphs found in this endpoint.</p>
          <p className="text-xs text-muted-foreground mt-1">
            The endpoint may be empty or introspection may have failed.
          </p>
        </div>
      )}
    </div>
  );
}
