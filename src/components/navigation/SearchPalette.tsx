"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchLabels } from "@/app/actions/graph";
import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { shortIRI } from "@/lib/utils";
import { Search } from "lucide-react";
import type { SearchResult } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchPalette({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const frame = useNavigationStore((s) => s.current());
  const pushFocus = useNavigationStore((s) => s.pushFocus);
  const getEndpoint = useEndpointStore((s) => s.getEndpoint);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || !frame.endpointId) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const endpoint = getEndpoint(frame.endpointId);
        if (!endpoint) return;

        const res = await searchLabels(
          endpoint.sparqlUrl,
          frame.graphIRI,
          query,
          endpoint.labelPredicate,
          endpoint.capabilities?.isPgRipple ?? false,
          endpoint.auth,
        );
        setResults(res);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, frame.endpointId, frame.graphIRI, getEndpoint]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      pushFocus(result.iri);
      onOpenChange(false);
      setQuery("");
    },
    [pushFocus, onOpenChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    },
    [results, selectedIndex, handleSelect],
  );

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Search entities</DialogTitle>
        <DialogDescription className="sr-only">
          Search for entities in the knowledge graph by label
        </DialogDescription>
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={frame.graphIRI ? `Search in ${shortIRI(frame.graphIRI)}...` : "Search..."}
            className="h-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          {loading && (
            <p className="text-sm text-muted-foreground p-2">Searching...</p>
          )}

          {!loading && query && results.length === 0 && (
            <p className="text-sm text-muted-foreground p-2">No results found.</p>
          )}

          {results.map((result, i) => (
            <button
              key={result.iri}
              onClick={() => handleSelect(result)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left ${
                i === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
              }`}
            >
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">{result.label}</span>
                <span className="text-xs text-muted-foreground truncate">{shortIRI(result.iri)}</span>
              </div>
              {result.typeLabel && (
                <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                  {result.typeLabel}
                </Badge>
              )}
            </button>
          ))}
        </div>

        <div className="border-t px-3 py-2 text-xs text-muted-foreground flex justify-between">
          <span>↑↓ navigate · ↵ select · esc close</span>
          <span>⌘K</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
