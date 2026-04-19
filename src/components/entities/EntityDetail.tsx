"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PredicateTable } from "./PredicateTable";
import { shortIRI } from "@/lib/utils";
import type { EntityNode } from "@/lib/types";

interface Props {
  entity: EntityNode;
}

export function EntityDetail({ entity }: Props) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {entity.label}
        </CardTitle>
        <p className="text-xs text-muted-foreground font-mono break-all">
          {entity.iri}
        </p>
        {entity.type && (
          <Badge variant="secondary" className="w-fit text-xs">
            {shortIRI(entity.type)}
          </Badge>
        )}
      </CardHeader>
      {entity.abstract && (
        <CardContent>
          <p className="text-base leading-relaxed text-foreground">
            {entity.abstract}
          </p>
        </CardContent>
      )}
      <CardContent>
        <PredicateTable entityIRI={entity.iri} />
      </CardContent>
    </Card>
  );
}
