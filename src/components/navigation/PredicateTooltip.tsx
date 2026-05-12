/**
 * PredicateTooltipContent — rich tooltip shown on predicate rows in the
 * Relationships Browser and Jump strip.
 *
 * Shows: role, cardinality hint, coverage %, and top 3 values with counts.
 * Top values are fetched lazily via SWR when the tooltip opens.
 */
"use client";

import useSWR from "swr";
import { fetchPredicateTopValues } from "@/app/actions/graph";
import { useEndpointStore } from "@/stores/endpoint-store";
import { RoleIcon, ROLE_LABEL } from "@/components/navigation/RoleIcon";
import { shortIRI } from "@/lib/utils";
import type { RelationshipInfo } from "@/app/actions/graph";

const CARDINALITY_HINT: Record<string, string> = {
  single:        "Usually one value per entity",
  "usually-single": "Typically one value, sometimes more",
  multi:          "Multiple values per entity",
  "highly-multi": "Many values per entity",
};

interface PredicateTooltipContentProps {
  rel: RelationshipInfo;
  endpointId: string;
  graphIRI: string | null;
  classIRI: string | undefined;
}

export function PredicateTooltipContent({
  rel,
  endpointId,
  graphIRI,
  classIRI,
}: PredicateTooltipContentProps) {
  const getEndpoint = useEndpointStore((s) => s.getEndpoint);
  const endpoint = getEndpoint(endpointId);

  const { data: topValues, isLoading } = useSWR(
    endpoint
      ? `topvals:${endpointId}:${graphIRI}:${classIRI ?? ""}:${rel.predicate}`
      : null,
    async () => {
      if (!endpoint) return [];
      return fetchPredicateTopValues(
        endpoint.sparqlUrl,
        graphIRI,
        rel.predicate,
        classIRI,
        endpoint.auth,
      );
    },
    { revalidateOnFocus: false },
  );

  return (
    <div className="space-y-1.5 max-w-xs">
      {/* IRI */}
      <p className="font-mono text-[10px] text-muted-foreground break-all">
        {rel.predicate}
      </p>

      {/* Role */}
      {rel.role && (
        <div className="flex items-center gap-1.5">
          <RoleIcon role={rel.role} />
          <span className="text-xs">{ROLE_LABEL[rel.role]}</span>
        </div>
      )}

      {/* Cardinality hint */}
      {rel.cardinality && (
        <p className="text-xs text-muted-foreground">
          {CARDINALITY_HINT[rel.cardinality] ?? rel.cardinality}
        </p>
      )}

      {/* Coverage */}
      {rel.coveragePercent !== undefined && (
        <p className="text-xs">
          Available on{" "}
          <span className="font-medium">{rel.coveragePercent}%</span> of this set
        </p>
      )}

      {/* Vocabulary badge */}
      {rel.vocabularyBadge && (
        <p className="text-[10px] text-muted-foreground">
          Vocabulary: {rel.vocabularyBadge}
        </p>
      )}

      {/* OWL characteristics — v0.5.0 */}
      {rel.owlCharacteristics && rel.owlCharacteristics.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {rel.owlCharacteristics.map((char) => (
            <span
              key={char}
              className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono"
              title={`OWL property characteristic: ${char}`}
            >
              {char}
            </span>
          ))}
        </div>
      )}

      {/* Top values */}
      <div className="pt-0.5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
          Top values
        </p>
        {isLoading ? (
          <p className="text-[10px] text-muted-foreground animate-pulse">Loading…</p>
        ) : topValues && topValues.length > 0 ? (
          <ul className="space-y-0.5">
            {topValues.slice(0, 3).map((tv, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="truncate max-w-[14rem] font-mono">
                  {shortIRI(tv.value)}
                </span>
                <span className="text-muted-foreground shrink-0">{tv.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[10px] text-muted-foreground">No values found</p>
        )}
      </div>
    </div>
  );
}
