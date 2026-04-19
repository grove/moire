"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { shortIRI } from "@/lib/utils";
import { useNavigationStore } from "@/stores/navigation-store";
import type { EntityNode, DetailLevel, DETAIL_TYPOGRAPHY } from "@/lib/types";

interface Props {
  entity: EntityNode;
  detailLevel: DetailLevel;
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

export function EntityCard({ entity, detailLevel }: Props) {
  const pushFocus = useNavigationStore((s) => s.pushFocus);
  const typo = TYPOGRAPHY[detailLevel];

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/40 border-border/60"
      onClick={() => pushFocus(entity.iri)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && pushFocus(entity.iri)}
      aria-label={`Navigate to ${entity.label}`}
    >
      <CardHeader className="p-3 pb-1">
        <CardTitle className={cn(typo.title)}>
          {entity.label}
        </CardTitle>

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
  );
}
