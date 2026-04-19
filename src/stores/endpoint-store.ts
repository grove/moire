"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EndpointConfig, GraphSummary } from "@/lib/types";

interface EndpointStore {
  endpoints: EndpointConfig[];
  introspectionCache: Record<string, GraphSummary[]>;
  addEndpoint: (config: EndpointConfig) => void;
  removeEndpoint: (id: string) => void;
  updateEndpoint: (id: string, updates: Partial<EndpointConfig>) => void;
  getEndpoint: (id: string) => EndpointConfig | undefined;
  setIntrospection: (endpointId: string, summaries: GraphSummary[]) => void;
  getIntrospection: (endpointId: string) => GraphSummary[] | undefined;
}

export const useEndpointStore = create<EndpointStore>()(
  persist(
    (set, get) => ({
      endpoints: [],
      introspectionCache: {},

      addEndpoint: (config) =>
        set((s) => ({
          endpoints: [...s.endpoints.filter(e => e.id !== config.id), config],
        })),

      removeEndpoint: (id) =>
        set((s) => ({
          endpoints: s.endpoints.filter((e) => e.id !== id),
          introspectionCache: Object.fromEntries(
            Object.entries(s.introspectionCache).filter(([k]) => k !== id)
          ),
        })),

      updateEndpoint: (id, updates) =>
        set((s) => ({
          endpoints: s.endpoints.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      getEndpoint: (id) => get().endpoints.find((e) => e.id === id),

      setIntrospection: (endpointId, summaries) =>
        set((s) => ({
          introspectionCache: {
            ...s.introspectionCache,
            [endpointId]: summaries,
          },
        })),

      getIntrospection: (endpointId) => get().introspectionCache[endpointId],
    }),
    {
      name: "moire-endpoints",
      partialize: (state) => ({
        endpoints: state.endpoints.map(e => ({
          ...e,
          // Don't persist credentials
          auth: undefined,
        })),
        introspectionCache: state.introspectionCache,
      }),
    }
  )
);
