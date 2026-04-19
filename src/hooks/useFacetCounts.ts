"use client";

import useSWR from "swr";
import { fetchFacetCounts } from "@/app/actions/graph";
import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import type { FacetDefinition, FacetValue } from "@/lib/types";

export function useFacetCounts(facetDefs: FacetDefinition[]) {
  const frame = useNavigationStore((s) => s.current());
  const getEndpoint = useEndpointStore((s) => s.getEndpoint);

  const isActive = (frame.context === "set" || frame.context === "entity") && frame.endpointId && facetDefs.length > 0;
  const key = isActive
    ? `facets:${frame.endpointId}:${frame.graphIRI}:${frame.focusIRI}:${frame.activeLayer}:${JSON.stringify(frame.facets)}:${facetDefs.map(f => f.id).join(",")}`
    : null;

  return useSWR<Record<string, FacetValue[]>>(
    key,
    async () => {
      const endpoint = getEndpoint(frame.endpointId);
      if (!endpoint) return {};

      return fetchFacetCounts(
        endpoint.sparqlUrl,
        frame.focusIRI,
        frame.graphIRI,
        frame.activeLayer,
        frame.facets,
        facetDefs,
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
