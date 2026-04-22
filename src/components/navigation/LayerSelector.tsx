"use client";

import { useNavigationStore } from "@/stores/navigation-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-xs text-muted-foreground mr-2 cursor-help">Layer:</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Controls how many hops away from the focused entity are shown</p>
        </TooltipContent>
      </Tooltip>
      {layers.map((layer) => (
        <Tooltip key={layer}>
          <TooltipTrigger asChild>
            <button
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
          </TooltipTrigger>
          <TooltipContent>
            <p>{LAYER_DESCRIPTIONS[layer]}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
