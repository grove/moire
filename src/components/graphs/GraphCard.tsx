"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigationStore } from "@/stores/navigation-store";
import { formatCount } from "@/lib/utils";
import type { GraphSummary } from "@/lib/types";

interface Props {
  graph: GraphSummary;
  endpointId: string;
}

// ── Vocabulary namespace → short label ───────────────────────

const VOCAB_LABELS: Record<string, string> = {
  "http://purl.org/dc/terms/": "DC Terms",
  "http://purl.org/dc/elements/1.1/": "Dublin Core",
  "http://xmlns.com/foaf/0.1/": "FOAF",
  "http://www.w3.org/2004/02/skos/core#": "SKOS",
  "http://www.w3.org/2000/01/rdf-schema#": "RDFS",
  "http://www.w3.org/2002/07/owl#": "OWL",
  "https://schema.org/": "Schema.org",
  "http://schema.org/": "Schema.org",
  "http://www.w3.org/ns/prov#": "PROV-O",
  "http://rdfs.org/ns/void#": "VoID",
};

function vocabLabel(iri: string): string {
  for (const [ns, label] of Object.entries(VOCAB_LABELS)) {
    if (iri === ns || iri === ns.slice(0, -1) || iri.startsWith(ns)) return label;
  }
  return iri.split(/[#/]/).filter(Boolean).pop() ?? iri;
}

function shortValue(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value.split(/[#/]/).filter(Boolean).pop() ?? value;
  }
  return value;
}

function formatDate(value: string): string {
  // Truncate to YYYY-MM-DD for dateTime values
  return value.slice(0, 10);
}

export function GraphCard({ graph, endpointId }: Props) {
  const setGraph = useNavigationStore((s) => s.setGraph);
  const vd = graph.voidMetadata;

  const displayTitle = vd?.title ?? graph.label ?? graph.iri;

  return (
    <Card className="border-border/60" data-testid="graph-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium truncate" title={graph.iri}>
          {displayTitle}
        </CardTitle>
        {vd?.description && (
          <p
            className="text-xs text-muted-foreground line-clamp-2"
            data-testid="void-description"
          >
            {vd.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatCount(graph.tripleCount)} triples
          {" · "}{graph.predicates.length} predicates
          {" · "}{graph.classes.length} classes
        </p>
        {(vd?.publisher || vd?.license || vd?.modified) && (
          <p
            className="text-xs text-muted-foreground"
            data-testid="void-secondary"
          >
            {vd.publisher && (
              <span>Publisher: {shortValue(vd.publisher)}</span>
            )}
            {vd.license && (
              <span>{vd.publisher ? " · " : ""}License: {shortValue(vd.license)}</span>
            )}
            {vd.modified && (
              <span>{(vd.publisher || vd.license) ? " · " : ""}Updated: {formatDate(vd.modified)}</span>
            )}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {/* Vocabulary badges from void:vocabulary */}
        {vd?.vocabularies && vd.vocabularies.length > 0 && (
          <div className="flex flex-wrap gap-1" data-testid="void-vocabularies">
            {vd.vocabularies.slice(0, 6).map((vocab) => (
              <Tooltip key={vocab}>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-[10px] cursor-help">
                    {vocabLabel(vocab)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs break-all">{vocab}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Class badges */}
        <div className="flex flex-wrap gap-1">
          {graph.classes.slice(0, 5).map((cls) => (
            <Tooltip key={cls.iri}>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-[10px] cursor-help">
                  {cls.label} ({formatCount(cls.instanceCount)})
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-mono text-xs break-all">{cls.iri}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatCount(cls.instanceCount)} instances of this class</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Suggested starting points from void:rootResource / void:exampleResource */}
        {((vd?.rootResources?.length ?? 0) > 0 || (vd?.exampleResources?.length ?? 0) > 0) && (
          <div data-testid="void-starting-points">
            <p className="text-xs text-muted-foreground font-medium mb-1">Suggested starting points</p>
            <div className="flex flex-wrap gap-1">
              {[...(vd?.rootResources ?? []), ...(vd?.exampleResources ?? [])]
                .slice(0, 4)
                .map((res) => (
                  <Tooltip key={res}>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="text-[10px] cursor-help"
                      >
                        {shortValue(res)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-mono text-xs break-all">{res}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
            </div>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setGraph(endpointId, graph.iri === "default" ? null : graph.iri)}
            >
              Browse this graph →
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Explore the types and entities in <span className="font-semibold">{displayTitle}</span></p>
            {graph.iri !== "default" && (
              <p className="font-mono text-xs text-muted-foreground mt-1 break-all">{graph.iri}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  );
}
