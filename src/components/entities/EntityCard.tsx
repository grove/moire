"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { shortIRI } from "@/lib/utils";
import { useNavigationStore } from "@/stores/navigation-store";
import { AlertTriangle } from "lucide-react";
import type { EntityNode, DetailLevel, DETAIL_TYPOGRAPHY } from "@/lib/types";

interface Props {
  entity: EntityNode;
  detailLevel: DetailLevel;
  /** Whether this entity has SHACL data quality violations. */
  hasViolations?: boolean;
}

const TYPOGRAPHY: typeof DETAIL_TYPOGRAPHY = {
  full: {
    title: "text-2xl font-bold tracking-tight",
    meta: "text-sm text-muted-foreground",
    body: "text-base leading-relaxed",
    badge: "text-xs font-medium",
  },
  summary: {
    title: "text-base font-semibold",
    meta: "text-xs text-muted-foreground",
    body: "text-sm line-clamp-2",
    badge: "text-[10px]",
  },
  headline: {
    title: "text-sm font-medium",
    meta: "hidden",
    body: "hidden",
    badge: "text-[10px]",
  },
  label: {
    title: "text-xs text-muted-foreground font-normal",
    meta: "hidden",
    body: "hidden",
    badge: "hidden",
  },
};

export function EntityCard({ entity, detailLevel, hasViolations }: Props) {
  const pushFocus = useNavigationStore((s) => s.pushFocus);
  const typo = TYPOGRAPHY[detailLevel];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/40 border-border/60"
          data-testid="entity-card"
          onClick={() => pushFocus(entity.iri)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && pushFocus(entity.iri)}
          aria-label={`Navigate to ${entity.label}`}
        >
          <CardHeader className="p-3 pb-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className={cn(typo.title)}>
                {entity.label}
              </CardTitle>
              {hasViolations && (
                <span
                  data-testid="shacl-violation-badge"
                  className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1 py-0.5"
                  title="This record has data quality issues"
                  aria-label="Data quality warning"
                >
                  <AlertTriangle className="h-2.5 w-2.5" aria-hidden />
                  Quality
                </span>
              )}
            </div>

            {detailLevel !== "label" && entity.type && (
              <Badge variant="secondary" className={cn("w-fit mt-1", typo.badge)}>
                {shortIRI(entity.type)}
              </Badge>
            )}
          </CardHeader>

          {(detailLevel === "summary" || detailLevel === "full") && entity.abstract && (
            <CardContent className="px-3 pb-3 pt-0">
              <p className={cn("text-muted-foreground leading-relaxed", typo.body)}>
                {entity.abstract}
              </p>
            </CardContent>
          )}
        </Card>
      </TooltipTrigger>
      <TooltipContent>
        <p>Open detail view for <span className="font-semibold">{entity.label}</span></p>
        <p className="font-mono text-xs text-muted-foreground mt-1 break-all">{entity.iri}</p>
        {hasViolations && (
          <p className="text-amber-600 text-xs mt-1">⚠ Data quality warnings present</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
