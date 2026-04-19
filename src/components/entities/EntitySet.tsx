"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEntitySet } from "@/hooks/useEntitySet";
import { useNavigationStore } from "@/stores/navigation-store";
import { EntityCard } from "./EntityCard";
import { EntityDetail } from "./EntityDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { LAYER_DETAIL } from "@/lib/types";

export function EntitySet() {
  const { data: entities, isLoading } = useEntitySet();
  const frame = useNavigationStore((s) => s.current());
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
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">No results</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or navigating to a different context.
        </p>
      </div>
    );
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
