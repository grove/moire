"use client";

import useSWR from "swr";
import { fetchEntityPredicates } from "@/app/actions/graph";
import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { shortIRI } from "@/lib/utils";
import { lookupPredicate, type PredicateRole } from "@/lib/vocabulary-registry";
import type { PredicateValue } from "@/lib/types";

interface Props {
  entityIRI: string;
}

// ── Role → display group label & sort order ─────────────────────────────────

const ROLE_GROUP_LABEL: Record<PredicateRole, string> = {
  relational:  "Relationships",
  classifying: "Types & Categories",
  descriptive: "Descriptions",
  temporal:    "Dates & Time",
  provenance:  "Provenance & Sources",
  numeric:     "Numeric Values",
  labelling:   "Labels & Names",
  media:       "Media",
  structural:  "Technical",
};

const ROLE_ORDER: PredicateRole[] = [
  "relational",
  "classifying",
  "descriptive",
  "temporal",
  "provenance",
  "numeric",
  "labelling",
  "media",
  "structural",
];

/** Return an ordered list of [groupLabel, predicates[]] pairs. */
function groupByRole(
  grouped: Record<string, PredicateValue[]>,
): Array<{ groupLabel: string; predicates: Array<{ iri: string; values: PredicateValue[] }> }> {
  type Group = { groupLabel: string; predicates: Array<{ iri: string; values: PredicateValue[] }>; order: number };
  const groupMap = new Map<string, Group>();

  for (const [predIRI, values] of Object.entries(grouped)) {
    const entry = lookupPredicate(predIRI);
    const role = entry.role as PredicateRole | undefined;
    const label = role ? (ROLE_GROUP_LABEL[role] ?? "Other") : "Other";
    const order = role ? (ROLE_ORDER.indexOf(role) >= 0 ? ROLE_ORDER.indexOf(role) : ROLE_ORDER.length) : ROLE_ORDER.length;

    if (!groupMap.has(label)) {
      groupMap.set(label, { groupLabel: label, predicates: [], order });
    }
    groupMap.get(label)!.predicates.push({ iri: predIRI, values });
  }

  return Array.from(groupMap.values())
    .sort((a, b) => a.order - b.order)
    .map(({ groupLabel, predicates }) => ({ groupLabel, predicates }));
}

export function PredicateTable({ entityIRI }: Props) {
  const frame = useNavigationStore((s) => s.current());
  const pushFocus = useNavigationStore((s) => s.pushFocus);
  const getEndpoint = useEndpointStore((s) => s.getEndpoint);

  const key = `predicates:${frame.endpointId}:${frame.graphIRI}:${entityIRI}`;

  const { data: rows } = useSWR<PredicateValue[]>(
    frame.endpointId ? key : null,
    async () => {
      const endpoint = getEndpoint(frame.endpointId);
      if (!endpoint) return [];
      return fetchEntityPredicates(endpoint.sparqlUrl, entityIRI, frame.graphIRI, endpoint.auth);
    },
    { revalidateOnFocus: false },
  );

  if (!rows?.length) {
    return <p className="text-sm text-muted-foreground">No predicates found.</p>;
  }

  // Group rows by predicate IRI first
  const grouped = rows.reduce<Record<string, PredicateValue[]>>((acc, row) => {
    if (!acc[row.predicate]) acc[row.predicate] = [];
    acc[row.predicate].push(row);
    return acc;
  }, {});

  const roleGroups = groupByRole(grouped);

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {roleGroups.map(({ groupLabel, predicates }) => (
          <section key={groupLabel} data-testid={`predicate-group-${groupLabel.replace(/\s+/g, "-").toLowerCase()}`}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 border-b pb-1">
              {groupLabel}
            </h4>
            <dl className="space-y-3 text-sm">
              {predicates.map(({ iri: predIRI, values }) => (
                <div
                  key={predIRI}
                  className="grid grid-cols-[180px_1fr] gap-x-3 gap-y-0.5 items-start"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <dt className="text-muted-foreground truncate font-mono text-xs pt-0.5 cursor-help">
                        {values[0].predLabel || shortIRI(predIRI)}
                      </dt>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-mono text-xs break-all max-w-md">{predIRI}</p>
                    </TooltipContent>
                  </Tooltip>
                  <dd className="space-y-0.5">
                    {values.map((v, i) =>
                      v.valueIsIRI ? (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-sm font-normal justify-start"
                              onClick={() => pushFocus(v.value)}
                            >
                              {v.valueLabel || shortIRI(v.value)}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Navigate to{" "}
                              <span className="font-semibold">
                                {v.valueLabel || shortIRI(v.value)}
                              </span>
                            </p>
                            <p className="font-mono text-xs text-muted-foreground mt-1 break-all">
                              {v.value}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span key={i} className="block break-words">
                          {v.value.length > 300 ? v.value.slice(0, 300) + "…" : v.value}
                        </span>
                      ),
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </TooltipProvider>
  );
}

