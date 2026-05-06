"use client";

import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { shortIRI } from "@/lib/utils";
import { buildContextHeader, type LabelCache } from "@/lib/context-header";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

type Crumb = {
  label: string;
  description?: string;
  /** If present this crumb is a clickable link. */
  action?: () => void;
};

export function LensBreadcrumb() {
  const stack = useNavigationStore((s) => s.stack);
  const pointer = useNavigationStore((s) => s.pointer);
  const frame = useNavigationStore((s) => s.current());
  const browseGraphs = useNavigationStore((s) => s.browseGraphs);
  const browseTypes = useNavigationStore((s) => s.browseTypes);
  const getEndpoint = useEndpointStore((s) => s.getEndpoint);
  const getIntrospection = useEndpointStore((s) => s.getIntrospection);

  const endpoint = getEndpoint(frame.endpointId);

  const labels: LabelCache = {
    graph: (iri) => {
      if (!iri) return "Default graph";
      const graphs = frame.endpointId ? getIntrospection(frame.endpointId) : undefined;
      const g = graphs?.find((g) => g.iri === iri);
      return g?.label ?? shortIRI(iri);
    },
    entity: (iri) => shortIRI(iri),
    class_: (iri) => shortIRI(iri),
    predicate: (iri) => shortIRI(iri),
    value: (iri) => shortIRI(iri),
  };

  const contextHeader = buildContextHeader(stack, pointer, labels);

  // ── Build crumb hierarchy ──────────────────────────────────────────────────
  //
  // Level 1: Endpoint — always shown; clickable when not already on graphs context.
  // Level 2: Named graph — shown only when deeper than the types browser
  //          (set / entity / relationships), so "Types in X" avoids duplication.
  //          Clicking navigates back to the types browser for that graph.
  // Level 3: Current context label — always last; never clickable.

  const crumbs: Crumb[] = [];

  if (endpoint) {
    crumbs.push({
      label: endpoint.label,
      description: `SPARQL endpoint: ${endpoint.sparqlUrl}`,
      action: frame.context !== "graphs" ? browseGraphs : undefined,
    });
  }

  const isPastTypes =
    frame.graphIRI !== null &&
    (frame.context === "set" ||
      frame.context === "entity" ||
      frame.context === "relationships");

  if (isPastTypes && frame.graphIRI) {
    crumbs.push({
      label: labels.graph(frame.graphIRI),
      description: `Named graph: ${frame.graphIRI}`,
      action: browseTypes,
    });
  }

  if (contextHeader) {
    crumbs.push({
      label: contextHeader,
      description: frame.focusIRI ? `Entity IRI: ${frame.focusIRI}` : undefined,
    });
  }

  return (
    <nav
      aria-label="Navigation breadcrumb"
      className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;

        const inner = crumb.action ? (
          <button
            onClick={crumb.action}
            className="hover:text-foreground hover:underline underline-offset-2 transition-colors"
            aria-label={`Navigate to ${crumb.label}`}
          >
            {crumb.label}
          </button>
        ) : (
          <span
            className={cn(
              isLast ? "text-foreground font-medium" : "",
              crumb.description ? "cursor-help" : "",
            )}
          >
            {crumb.label}
          </span>
        );

        return (
          <span key={i} className="flex items-center gap-1 shrink-0">
            {i > 0 && <ChevronRight className="h-3 w-3" />}
            {crumb.description ? (
              <Tooltip>
                <TooltipTrigger asChild>{inner}</TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs break-all">{crumb.description}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              inner
            )}
          </span>
        );
      })}
    </nav>
  );
}

