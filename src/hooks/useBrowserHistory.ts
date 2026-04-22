"use client";

import { useEffect } from "react";
import { useNavigationStore } from "@/stores/navigation-store";

/**
 * Syncs the internal Zustand navigation stack with the browser History API.
 * - Stamps the current history entry with the initial pointer on mount.
 * - Listens for popstate (browser back/forward) and updates the Zustand pointer.
 */
export function useBrowserHistory() {
  useEffect(() => {
    // Stamp the current (initial) history entry so popstate has our state
    history.replaceState(
      { ...history.state, navPointer: useNavigationStore.getState().pointer },
      "",
    );

    function handlePopState(event: PopStateEvent) {
      const navPointer = event.state?.navPointer;
      if (typeof navPointer === "number") {
        const { stack } = useNavigationStore.getState();
        useNavigationStore.setState({
          pointer: Math.max(0, Math.min(stack.length - 1, navPointer)),
        });
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
}
