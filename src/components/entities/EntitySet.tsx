"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEntitySet } from "@/hooks/useEntitySet";
import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { EntityCard } from "./EntityCard";
import { EntityDetail } from "./EntityDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { shortIRI } from "@/lib/utils";
import { LAYER_DETAIL } from "@/lib/types";

export function EntitySet() {
  const { data: entities, isLoading } = useEntitySet();
  const frame = useNavigationStore((s) => s.current());
  const back = useNavigationStore((s) => s.back);
  const clearAllFacets = useNavigationStore((s) => s.clearAllFacets);
  const getIntrospection = useEndpointStore((s) => s.getIntrospection);
  const detailLevel = LAYER_DETAIL[frame.activeLayer] ?? "headline";

  if (isLoading && !entities?.length) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!entities?.length) {
    return <EmptyState frame={frame} back={back} clearAllFacets={clearAllFacets} getIntrospection={getIntrospection} />;
  }

  // Entity detail view at layer 0
  if (frame.context === "entity" && frame.activeLayer === 0 && entities[0]) {
    return <EntityDetail entity={entities[0]} />;
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4" aria-live="polite" aria-atomic="true">
        {entities.length} {entities.length === 1 ? "entity" : "entities"}
        {isLoading && " · Loading..."}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {entities.map((entity) => (
            <motion.div
              key={entity.iri}
              layoutId={entity.iri}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <EntityCard entity={entity} detailLevel={detailLevel} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────

interface EmptyStateProps {
  frame: import("@/lib/types").LensFrame;
  back: () => void;
  clearAllFacets: () => void;
  getIntrospection: (endpointId: string) => import("@/lib/types").GraphSummary[] | undefined;
}

function EmptyState({ frame, back, clearAllFacets, getIntrospection }: EmptyStateProps) {
  const hasActiveFacets = Object.keys(frame.facets).length > 0;
  const hasNavigationPredicate = !!frame.navigationPredicate;

  // Build a human-readable predicate label
  const predicateLabel = frame.navigationPredicate
    ? shortIRI(frame.navigationPredicate)
    : null;

  // Look up coverage info from introspection cache
  let coverageText: string | null = null;
  if (hasNavigationPredicate && frame.navigationPredicate) {
    const summaries = getIntrospection(frame.endpointId);
    const graphSummary = summaries?.find(
      (s) => s.iri === (frame.graphIRI ?? "default"),
    );
    if (graphSummary) {
      const predSummary = graphSummary.predicates.find(
        (p) => p.iri === frame.navigationPredicate,
      );
      if (predSummary && graphSummary.subjectCount > 0) {
        const used = predSummary.subjectCount;
        const total = graphSummary.subjectCount;
        coverageText = `"${predicateLabel}" is used by ${used} of ${total} entities in this graph.`;
      }
    }
  }

  // Diagnose facet-based empty state
  if (hasActiveFacets) {
    const activeFilterNames = Object.entries(frame.facets)
      .flatMap(([_dim, vals]) =>
        vals.map((v) => shortIRI(v)),
      )
      .slice(0, 3);

    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center gap-3"
        data-testid="empty-state-filter"
      >
        <p className="text-lg font-medium text-muted-foreground">No matching records</p>
        <p className="text-sm text-muted-foreground">
          Active filters leave no matching records.
        </p>
        {activeFilterNames.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Try removing:{" "}
            {activeFilterNames.map((name, i) => (
              <span key={name}>
                {i > 0 && ", "}
                <span className="font-medium">{name}</span>
              </span>
            ))}
          </p>
        )}
        <Button variant="outline" size="sm" onClick={clearAllFacets} className="mt-1">
          Clear all filters
        </Button>
      </div>
    );
  }

  // Traversal zero-result
  if (hasNavigationPredicate) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center gap-3"
        data-testid="empty-state-traversal"
      >
        <p className="text-lg font-medium text-muted-foreground">No results found</p>
        {coverageText ? (
          <p className="text-sm text-muted-foreground max-w-sm">{coverageText}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No entities were found via{" "}
            <span className="font-mono font-medium">{predicateLabel}</span>.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Try filtering entities first, or follow a different path.
        </p>
        <Button variant="outline" size="sm" onClick={back} className="mt-1">
          Go back
        </Button>
      </div>
    );
  }

  // Generic empty state
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-lg font-medium text-muted-foreground">No results</p>
      <p className="text-sm text-muted-foreground mt-1">
        Try adjusting your filters or navigating to a different context.
      </p>
    </div>
  );
}

