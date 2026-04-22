"use client";

import { useState, useCallback } from "react";
import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useBrowserHistory } from "@/hooks/useBrowserHistory";
import { generateFacets } from "@/lib/facet-generator";

// Navigation
import { BackForwardControls } from "@/components/navigation/BackForwardControls";
import { LensBreadcrumb } from "@/components/navigation/LensBreadcrumb";
import { LayerSelector } from "@/components/navigation/LayerSelector";
import { SearchPalette } from "@/components/navigation/SearchPalette";
import { TypesBrowser } from "@/components/navigation/TypesBrowser";
import { RelationshipsBrowser } from "@/components/navigation/RelationshipsBrowser";
import { JumpViaStrip } from "@/components/navigation/JumpViaStrip";

// Content
import { EndpointManager } from "@/components/endpoint/EndpointManager";
import { GraphsBrowser } from "@/components/graphs/GraphsBrowser";
import { EntitySet } from "@/components/entities/EntitySet";
import { FacetSidebar } from "@/components/facets/FacetSidebar";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search } from "lucide-react";

export function NavigationShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const frame = useNavigationStore((s) => s.current());
  const getEndpoint = useEndpointStore((s) => s.getEndpoint);
  const getIntrospection = useEndpointStore((s) => s.getIntrospection);

  useKeyboardShortcuts(useCallback(() => setSearchOpen(true), []));
  useBrowserHistory();

  const endpoint = frame.endpointId ? getEndpoint(frame.endpointId) : undefined;

  // No endpoint selected — show endpoint manager
  if (!endpoint) {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto">
        <EndpointManager />
        <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    );
  }

  // Get facet definitions from introspection
  const graphs = getIntrospection(frame.endpointId);
  const currentGraph = graphs?.find(
    (g) => g.iri === (frame.graphIRI ?? "default"),
  );
  const facetDefs = currentGraph ? generateFacets(currentGraph.predicates) : [];

  const showFacets = frame.context === "set" || frame.context === "entity";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b px-4 py-2 flex items-center gap-3 sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <BackForwardControls />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="ml-auto text-xs text-muted-foreground h-8 w-64 justify-start"
            >
              <Search className="h-3 w-3 mr-2" />
              Search... <kbd className="ml-auto text-[10px] bg-muted px-1 rounded">⌘K</kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search entities across the graph (⌘K)</p>
          </TooltipContent>
        </Tooltip>
      </header>

      {/* Context header + breadcrumb */}
      <div className="border-b px-4 py-2 space-y-1">
        <LensBreadcrumb />
      </div>

      {/* Main content area */}
      <div className="flex flex-1">
        {/* Facet sidebar */}
        {showFacets && facetDefs.length > 0 && (
          <div className="border-r">
            <FacetSidebar facetDefs={facetDefs} />
          </div>
        )}

        {/* Content panel */}
        <main className="flex-1 p-4 space-y-4">
          {/* Context-specific view */}
          {frame.context === "graphs" && (
            <GraphsBrowser
              endpointId={frame.endpointId}
              sparqlUrl={endpoint.sparqlUrl}
            />
          )}

          {frame.context === "types" && <TypesBrowser />}

          {frame.context === "relationships" && <RelationshipsBrowser />}

          {(frame.context === "set" || frame.context === "entity") && (
            <>
              <EntitySet />

              <div className="flex items-center gap-4 flex-wrap pt-2">
                <LayerSelector />
                <JumpViaStrip />
              </div>
            </>
          )}
        </main>
      </div>

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
