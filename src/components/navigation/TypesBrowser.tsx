"use client";

import { useNavigationStore } from "@/stores/navigation-store";
import { useEndpointStore } from "@/stores/endpoint-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCount } from "@/lib/utils";
import type { ClassSummary } from "@/lib/types";

export function TypesBrowser() {
  const frame = useNavigationStore((s) => s.current());
  const setClass = useNavigationStore((s) => s.setClass);
  const browseRelationships = useNavigationStore((s) => s.browseRelationships);
  const getIntrospection = useEndpointStore((s) => s.getIntrospection);

  const graphs = getIntrospection(frame.endpointId);
  const currentGraph = graphs?.find(
    (g) => g.iri === (frame.graphIRI ?? "default"),
  );

  const classes = currentGraph?.classes ?? [];

  // Build tree structure
  const rootClasses = buildClassTree(classes);

  if (!currentGraph) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {classes.length} {classes.length === 1 ? "class" : "classes"} discovered
        {" · "}sorted by instance count
      </p>

      <div className="space-y-2">
        {rootClasses.map((node) => (
          <ClassNode key={node.iri} node={node} depth={0} onSelect={setClass} />
        ))}
      </div>

      <Separator />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={browseRelationships}
            className="text-xs"
          >
            Browse Relationships →
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>See all predicates and how entities connect in this graph</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

interface ClassTreeNode {
  iri: string;
  label: string;
  instanceCount: number;
  children: ClassTreeNode[];
}

function buildClassTree(classes: ClassSummary[]): ClassTreeNode[] {
  const nodeMap = new Map<string, ClassTreeNode>();

  for (const cls of classes) {
    nodeMap.set(cls.iri, {
      iri: cls.iri,
      label: cls.label,
      instanceCount: cls.instanceCount,
      children: [],
    });
  }

  const roots: ClassTreeNode[] = [];

  for (const cls of classes) {
    const node = nodeMap.get(cls.iri)!;
    if (cls.superClass && nodeMap.has(cls.superClass)) {
      nodeMap.get(cls.superClass)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort by instance count descending
  const sortNodes = (nodes: ClassTreeNode[]) => {
    nodes.sort((a, b) => b.instanceCount - a.instanceCount);
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

function ClassNode({
  node,
  depth,
  onSelect,
}: {
  node: ClassTreeNode;
  depth: number;
  onSelect: (classIRI: string) => void;
}) {
  return (
    <div style={{ paddingLeft: `${depth * 20}px` }}>
      <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-2 min-w-0">
          {depth > 0 && (
            <span className="text-muted-foreground text-xs">├─</span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm font-medium truncate cursor-help">
                {node.label}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs break-all">{node.iri}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatCount(node.instanceCount)} instances in the graph</p>
            </TooltipContent>
          </Tooltip>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatCount(node.instanceCount)} instances
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect(node.iri)}
              className="text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              Browse as set →
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Filter the view to show only <span className="font-semibold">{node.label}</span> entities</p>
          </TooltipContent>
        </Tooltip>
      </div>
      {node.children.map((child) => (
        <ClassNode key={child.iri} node={child} depth={depth + 1} onSelect={onSelect} />
      ))}
    </div>
  );
}
