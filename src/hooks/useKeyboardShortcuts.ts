"use client";

import { useEffect, useCallback } from "react";
import { useNavigationStore } from "@/stores/navigation-store";

export function useKeyboardShortcuts(onOpenSearch: () => void) {
  const { back, forward, setLayer } = useNavigationStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K — open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      // Alt+← — back
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        back();
        return;
      }

      // Alt+→ — forward
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        forward();
        return;
      }

      // 1-5 — layer shortcuts
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const layerMap: Record<string, number> = {
          "1": -2,
          "2": -1,
          "3": 0,
          "4": 1,
          "5": 2,
        };
        if (e.key in layerMap && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          setLayer(layerMap[e.key]);
        }
      }
    },
    [back, forward, setLayer, onOpenSearch],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
