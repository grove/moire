"use client";

import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { shortIRI } from "@/lib/utils";
import { buildContextHeader, type LabelCache } from "@/lib/context-header";
import { ChevronRight } from "lucide-react";

export function LensBreadcrumb() {
  const stack = useNavigationStore((s) => s.stack);
  const pointer = useNavigationStore((s) => s.pointer);
  const frame = useNavigationStore((s) => s.current());
  const getEndpoint = useEndpointStore((s) => s.getEndpoint);
  const getIntrospection = useEndpointStore((s) => s.getIntrospection);

  const endpoint = getEndpoint(frame.endpointId);

  // Simple label cache from introspection data
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

  const crumbs: Array<{ label: string; action?: () => void }> = [];

  if (endpoint) {
    crumbs.push({ label: endpoint.label });
  }

  if (frame.graphIRI) {
    crumbs.push({ label: labels.graph(frame.graphIRI) });
  }

  if (contextHeader) {
    crumbs.push({ label: contextHeader });
  }

  return (
    <nav aria-label="Navigation breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1 shrink-0">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          <span className={i === crumbs.length - 1 ? "text-foreground font-medium" : ""}>
            {crumb.label}
          </span>
        </span>
      ))}
    </nav>
  );
}
