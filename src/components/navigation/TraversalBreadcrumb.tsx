/**
 * TraversalBreadcrumb — shows the traversal path through the navigation stack.
 *
 * Format: SE Researchers → affiliated with → Universities → located in → Cities
 *
 * Each chip shows a predicate role icon, the predicate label, and the target
 * set label. Clicking a chip jumps back to that frame in the stack.
 *
 * Only rendered when the current context is "set" (after at least one traversal)
 * or when there are multiple set frames in the stack.
 */
"use client";

import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { shortIRI, pluralise } from "@/lib/utils";
import { lookupPredicate } from "@/lib/vocabulary-registry";
import { RoleIcon } from "@/components/navigation/RoleIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LensFrame } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────

function setLabelForFrame(frame: LensFrame, getClassLabel: (iri: string) => string): string {
  if (frame.focusClass) {
    return pluralise(getClassLabel(frame.focusClass));
  }
  const typeFacet = frame.facets["rdf:type"];
  if (typeFacet?.length) {
    return pluralise(getClassLabel(typeFacet[0]));
  }
  return "Resources";
}

// ── Component ─────────────────────────────────────────────────

export function TraversalBreadcrumb() {
  const stack = useNavigationStore((s) => s.stack);
  const pointer = useNavigationStore((s) => s.pointer);
  const navigateToFrame = useNavigationStore((s) => s.navigateToFrame);
  const getIntrospection = useEndpointStore((s) => s.getIntrospection);
  const frame = stack[pointer];

  const introspection = getIntrospection(frame.endpointId);
  const currentGraph = introspection?.find(
    (g) => g.iri === (frame.graphIRI ?? "default"),
  );

  function getClassLabel(iri: string): string {
    const cls = currentGraph?.classes.find((c) => c.iri === iri);
    return cls?.label ?? shortIRI(iri);
  }

  function getPredicateLabel(iri: string): string {
    const pred = currentGraph?.predicates.find((p) => p.iri === iri);
    return pred?.label ?? shortIRI(iri);
  }

  // Collect all "set" frames from frame 0 up to pointer
  type Segment = {
    frameIndex: number;
    setLabel: string;
    /** Predicate used to reach the NEXT segment (undefined for last). */
    outPredicateIRI?: string;
    outPredicateLabel?: string;
  };

  const segments: Segment[] = [];

  for (let i = 0; i <= pointer; i++) {
    const f = stack[i];
    if (f.context !== "set") continue;

    const setLabel = setLabelForFrame(f, getClassLabel);

    // Update the previous segment's outgoing predicate if this frame was a traversal
    if (segments.length > 0 && f.navigationPredicate) {
      const prev = segments[segments.length - 1];
      prev.outPredicateIRI = f.navigationPredicate;
      prev.outPredicateLabel = getPredicateLabel(f.navigationPredicate);
    }

    segments.push({ frameIndex: i, setLabel });
  }

  // Only show when there is at least one traversal (≥ 2 set frames, or 1 set frame
  // that was reached via a navigation predicate).
  if (segments.length === 0) return null;
  if (
    segments.length === 1 &&
    !stack[segments[0].frameIndex].navigationPredicate
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Traversal path"
      className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto"
    >
      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        const canNavigate = !isLast;
        const predicateEntry = seg.outPredicateIRI
          ? lookupPredicate(seg.outPredicateIRI)
          : null;

        return (
          <span key={seg.frameIndex} className="flex items-center gap-1 shrink-0">
            {/* Set chip */}
            {canNavigate ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigateToFrame(seg.frameIndex)}
                    className="hover:text-foreground hover:underline underline-offset-2 transition-colors px-1 rounded"
                    aria-label={`Go back to ${seg.setLabel}`}
                  >
                    {seg.setLabel}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Navigate back to {seg.setLabel}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className={cn("text-foreground font-medium px-1")}>
                {seg.setLabel}
              </span>
            )}

            {/* Predicate arrow → next segment */}
            {seg.outPredicateLabel && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-0.5 px-1 rounded cursor-help">
                      {predicateEntry && (
                        <RoleIcon role={predicateEntry.role} className="h-3 w-3" />
                      )}
                      <span className="font-mono text-[11px]">{seg.outPredicateLabel}</span>
                    </span>
                  </TooltipTrigger>
                  {seg.outPredicateIRI && (
                    <TooltipContent>
                      <p className="font-mono text-xs break-all">{seg.outPredicateIRI}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                <ChevronRight className="h-3 w-3 shrink-0" />
              </>
            )}
          </span>
        );
      })}
    </nav>
  );
}
