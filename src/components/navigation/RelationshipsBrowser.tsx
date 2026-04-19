"use client";

import useSWR from "swr";
import { fetchRelationships, type RelationshipInfo } from "@/app/actions/graph";
import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { formatCount } from "@/lib/utils";

export function RelationshipsBrowser() {
  const frame = useNavigationStore((s) => s.current());
  const traverseVia = useNavigationStore((s) => s.traverseVia);
  const getEndpoint = useEndpointStore((s) => s.getEndpoint);

  const key = frame.endpointId
    ? `relationships:${frame.endpointId}:${frame.graphIRI}:${frame.focusClass ?? "all"}`
    : null;

  const { data: relationships, isLoading } = useSWR<RelationshipInfo[]>(
    key,
    async () => {
      const endpoint = getEndpoint(frame.endpointId);
      if (!endpoint) return [];
      return fetchRelationships(
        endpoint.sparqlUrl,
        frame.graphIRI,
        frame.focusClass,
        endpoint.auth,
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

  const iriRels = relationships?.filter((r) => r.valueKind === "iri") ?? [];
  const literalRels = relationships?.filter((r) => r.valueKind !== "iri") ?? [];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Relationships on the current {frame.focusClass ? "set" : "graph"}
        </p>

        {iriRels.length > 0 && (
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Outgoing (subject → object)
            </h3>
            <Separator />
            {iriRels.map((rel) => (
              <RelationshipRow
                key={rel.predicate}
                rel={rel}
                onFollow={() => traverseVia(rel.predicate)}
              />
            ))}
          </div>
        )}

        {literalRels.length > 0 && (
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Literal properties
            </h3>
            <Separator />
            {literalRels.map((rel) => (
              <div
                key={rel.predicate}
                className="flex items-center justify-between py-1.5 px-2 text-sm"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-mono text-xs cursor-help">{rel.label}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono text-xs break-all">{rel.predicate}</p>
                  </TooltipContent>
                </Tooltip>
                <span className="text-xs text-muted-foreground">
                  {formatCount(rel.subjectCount)} subjects
                </span>
              </div>
            ))}
          </div>
        )}

        {(!relationships || relationships.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No relationships found.
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}

function RelationshipRow({
  rel,
  onFollow,
}: {
  rel: RelationshipInfo;
  onFollow: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors group">
      <div className="flex items-center gap-2 min-w-0">
        {rel.isNavigationCandidate && (
          <span className="text-yellow-500 text-xs" title="Navigation candidate">★</span>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-mono text-xs cursor-help truncate">{rel.label}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono text-xs break-all">{rel.predicate}</p>
          </TooltipContent>
        </Tooltip>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatCount(rel.subjectCount)} subjects → {formatCount(rel.objectCount)} objects
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onFollow}
        className="text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        Follow as set →
      </Button>
    </div>
  );
}
