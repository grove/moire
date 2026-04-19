"use client";

import useSWR from "swr";
import { fetchEntitySet } from "@/app/actions/graph";
import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import type { EntityNode } from "@/lib/types";

export function useEntitySet() {
  const frame = useNavigationStore((s) => s.current());
  const getEndpoint = useEndpointStore((s) => s.getEndpoint);

  const isSetContext = frame.context === "set" || frame.context === "entity";
  const key = isSetContext && frame.endpointId
    ? `entities:${frame.endpointId}:${frame.graphIRI}:${frame.context}:${frame.focusIRI}:${frame.navigationPredicate ?? ""}:${frame.activeLayer}:${JSON.stringify(frame.facets)}`
    : null;

  return useSWR<EntityNode[]>(
    key,
    async () => {
      const endpoint = getEndpoint(frame.endpointId);
      if (!endpoint) return [];

      return fetchEntitySet(
        endpoint.sparqlUrl,
        frame.focusIRI,
        frame.graphIRI,
        frame.activeLayer,
        frame.facets,
        endpoint.labelPredicate,
        frame.navigationPredicate,
        undefined,
        endpoint.auth,
      );
    },
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    },
  );
}
