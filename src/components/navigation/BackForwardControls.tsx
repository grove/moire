"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigationStore } from "@/stores/navigation-store";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function BackForwardControls() {
  const canBack = useNavigationStore((s) => s.canBack());
  const canForward = useNavigationStore((s) => s.canForward());
  const back = useNavigationStore((s) => s.back);
  const forward = useNavigationStore((s) => s.forward);

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={back}
            disabled={!canBack}
            aria-label="Go back"
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Go back</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={forward}
            disabled={!canForward}
            aria-label="Go forward"
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Go forward</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
