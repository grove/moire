"use client";

import useSWR from "swr";
import { fetchEntityPredicates } from "@/app/actions/graph";
import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { shortIRI } from "@/lib/utils";
import type { PredicateValue } from "@/lib/types";

interface Props {
  entityIRI: string;
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

  // Group rows by predicate
  const grouped = rows.reduce<Record<string, PredicateValue[]>>((acc, row) => {
    if (!acc[row.predicate]) acc[row.predicate] = [];
    acc[row.predicate].push(row);
    return acc;
  }, {});

  return (
    <TooltipProvider>
      <dl className="space-y-3 text-sm">
        {Object.entries(grouped).map(([predIRI, values]) => (
          <div key={predIRI} className="grid grid-cols-[180px_1fr] gap-x-3 gap-y-0.5 items-start">
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
                  <Button
                    key={i}
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-sm font-normal justify-start"
                    onClick={() => pushFocus(v.value)}
                    title={v.value}
                  >
                    {v.valueLabel || shortIRI(v.value)}
                  </Button>
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
    </TooltipProvider>
  );
}
