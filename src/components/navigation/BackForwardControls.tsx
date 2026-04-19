"use client";

import { Button } from "@/components/ui/button";
import { useNavigationStore } from "@/stores/navigation-store";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function BackForwardControls() {
  const canBack = useNavigationStore((s) => s.canBack());
  const canForward = useNavigationStore((s) => s.canForward());
  const back = useNavigationStore((s) => s.back);
  const forward = useNavigationStore((s) => s.forward);

  return (
    <div className="flex items-center gap-1">
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
    </div>
  );
}
