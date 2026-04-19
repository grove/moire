"use client";

import { create } from "zustand";
import type { LensFrame } from "@/lib/types";

interface NavigationStore {
  stack: LensFrame[];
  pointer: number;
  current: () => LensFrame;
  canBack: () => boolean;
  canForward: () => boolean;
  pushFocus: (iri: string) => void;
  traverseVia: (predicateIRI: string) => void;
  setClass: (classIRI: string) => void;
  setGraph: (endpointId: string, graphIRI: string | null) => void;
  browseTypes: () => void;
  browseRelationships: () => void;
  setLayer: (layer: number) => void;
  toggleFacet: (dim: string, value: string) => void;
  clearFacet: (dim: string) => void;
  clearAllFacets: () => void;
  back: () => void;
  forward: () => void;
  setEndpoint: (endpointId: string) => void;
}

const initialFrame: LensFrame = {
  endpointId: "",
  graphIRI: null,
  context: "graphs",
  focusIRI: "",
  activeLayer: 1,
  facets: {},
};

function pushFrame(state: { stack: LensFrame[]; pointer: number }, newFrame: LensFrame) {
  const newStack = [...state.stack.slice(0, state.pointer + 1), newFrame];
  return { stack: newStack, pointer: newStack.length - 1 };
}

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  stack: [initialFrame],
  pointer: 0,

  current: () => get().stack[get().pointer],
  canBack: () => get().pointer > 0,
  canForward: () => get().pointer < get().stack.length - 1,

  setEndpoint: (endpointId) =>
    set((s) => pushFrame(s, {
      endpointId,
      graphIRI: null,
      context: "graphs",
      focusIRI: "",
      activeLayer: 1,
      facets: {},
    })),

  pushFocus: (iri) =>
    set((s) => {
      const prev = s.stack[s.pointer];
      return pushFrame(s, {
        endpointId: prev.endpointId,
        graphIRI: prev.graphIRI,
        context: "entity",
        focusIRI: iri,
        activeLayer: 0,
        facets: prev.facets,
      });
    }),

  traverseVia: (predicateIRI) =>
    set((s) => {
      const prev = s.stack[s.pointer];
      return pushFrame(s, {
        endpointId: prev.endpointId,
        graphIRI: prev.graphIRI,
        context: "set",
        focusIRI: "",
        navigationPredicate: predicateIRI,
        activeLayer: 1,
        facets: {},
      });
    }),

  setClass: (classIRI) =>
    set((s) => {
      const prev = s.stack[s.pointer];
      return pushFrame(s, {
        endpointId: prev.endpointId,
        graphIRI: prev.graphIRI,
        context: "set",
        focusIRI: "",
        focusClass: classIRI,
        activeLayer: 1,
        facets: { "rdf:type": [classIRI] },
      });
    }),

  setGraph: (endpointId, graphIRI) =>
    set((s) => pushFrame(s, {
      endpointId,
      graphIRI,
      context: "types",
      focusIRI: "",
      activeLayer: 1,
      facets: {},
    })),

  browseTypes: () =>
    set((s) => {
      const prev = s.stack[s.pointer];
      return pushFrame(s, {
        endpointId: prev.endpointId,
        graphIRI: prev.graphIRI,
        context: "types",
        focusIRI: "",
        activeLayer: 1,
        facets: {},
      });
    }),

  browseRelationships: () =>
    set((s) => {
      const prev = s.stack[s.pointer];
      return pushFrame(s, {
        endpointId: prev.endpointId,
        graphIRI: prev.graphIRI,
        context: "relationships",
        focusIRI: "",
        focusClass: prev.focusClass,
        activeLayer: 1,
        facets: prev.facets,
      });
    }),

  setLayer: (layer) =>
    set((s) => {
      const updated = [...s.stack];
      updated[s.pointer] = { ...updated[s.pointer], activeLayer: layer };
      return { stack: updated };
    }),

  toggleFacet: (dim, value) =>
    set((s) => {
      const current = s.stack[s.pointer].facets[dim] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const updated = [...s.stack];
      updated[s.pointer] = {
        ...updated[s.pointer],
        facets: { ...updated[s.pointer].facets, [dim]: next.length ? next : [] },
      };
      // Remove empty facet arrays
      if (!next.length) {
        const { [dim]: _removed, ...rest } = updated[s.pointer].facets;
        updated[s.pointer] = { ...updated[s.pointer], facets: rest };
      }
      return { stack: updated };
    }),

  clearFacet: (dim) =>
    set((s) => {
      const { [dim]: _removed, ...rest } = s.stack[s.pointer].facets;
      const updated = [...s.stack];
      updated[s.pointer] = { ...updated[s.pointer], facets: rest };
      return { stack: updated };
    }),

  clearAllFacets: () =>
    set((s) => {
      const updated = [...s.stack];
      updated[s.pointer] = { ...updated[s.pointer], facets: {} };
      return { stack: updated };
    }),

  back: () => set((s) => ({ pointer: Math.max(0, s.pointer - 1) })),
  forward: () => set((s) => ({ pointer: Math.min(s.stack.length - 1, s.pointer + 1) })),
}));
