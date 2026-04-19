"use client";

import { useNavigationStore } from "@/stores/navigation-store";
import { cn } from "@/lib/utils";
import { LAYER_DESCRIPTIONS } from "@/lib/types";

export function LayerSelector() {
  const frame = useNavigationStore((s) => s.current());
  const setLayer = useNavigationStore((s) => s.setLayer);

  // Only show in entity context
  if (frame.context !== "entity") return null;

  const layers = [-2, -1, 0, 1, 2];

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Layer depth selector">
      <span className="text-xs text-muted-foreground mr-2">Layer:</span>
      {layers.map((layer) => (
        <button
          key={layer}
          onClick={() => setLayer(layer)}
          className={cn(
            "px-2 py-1 text-xs rounded transition-colors",
            frame.activeLayer === layer
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted text-muted-foreground",
          )}
          aria-label={LAYER_DESCRIPTIONS[layer]}
          aria-pressed={frame.activeLayer === layer}
        >
          {layer === 0 ? "Focus" : layer > 0 ? `+${layer}` : layer}
        </button>
      ))}
    </div>
  );
}
