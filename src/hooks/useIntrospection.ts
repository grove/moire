"use client";

import useSWR from "swr";
import { introspectEndpoint } from "@/app/actions/graph";
import { useEndpointStore } from "@/stores/endpoint-store";
import type { GraphSummary } from "@/lib/types";

export function useIntrospection(endpointId: string) {
  const getEndpoint = useEndpointStore((s) => s.getEndpoint);
  const setIntrospection = useEndpointStore((s) => s.setIntrospection);
  const cached = useEndpointStore((s) => s.getIntrospection(endpointId));

  const key = endpointId ? `introspect:${endpointId}` : null;

  const result = useSWR<GraphSummary[]>(
    key,
    async () => {
      const endpoint = getEndpoint(endpointId);
      if (!endpoint) return [];

      const summaries = await introspectEndpoint(endpoint);
      setIntrospection(endpointId, summaries);
      return summaries;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      fallbackData: cached,
    },
  );

  return result;
}
