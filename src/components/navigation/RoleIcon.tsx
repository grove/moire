/**
 * RoleIcon — maps a PredicateRole to a visually distinct Lucide icon.
 *
 * Used in the Relationships Browser rows, Jump strip buttons, and
 * Traversal Breadcrumb to give users an at-a-glance signal about what
 * kind of relationship they are looking at.
 */
import {
  Tag,
  FileText,
  Layers,
  ArrowLeftRight,
  Clock,
  Hash,
  GitBranch,
  Wrench,
  Image,
  HelpCircle,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { PredicateRole } from "@/lib/vocabulary-registry";
import { cn } from "@/lib/utils";

// Accessible colour class per role — chosen for visual distinctiveness.
const ROLE_COLOUR: Record<PredicateRole, string> = {
  labelling:    "text-amber-500",
  descriptive:  "text-sky-500",
  classifying:  "text-violet-500",
  relational:   "text-emerald-500",
  temporal:     "text-blue-500",
  numeric:      "text-orange-500",
  provenance:   "text-rose-500",
  structural:   "text-zinc-400",
  media:        "text-pink-500",
};

const ROLE_ICON: Record<PredicateRole, React.ComponentType<LucideProps>> = {
  labelling:    Tag,
  descriptive:  FileText,
  classifying:  Layers,
  relational:   ArrowLeftRight,
  temporal:     Clock,
  numeric:      Hash,
  provenance:   GitBranch,
  structural:   Wrench,
  media:        Image,
};

// Human-readable label used in tooltips / aria labels.
export const ROLE_LABEL: Record<PredicateRole, string> = {
  labelling:    "Labelling",
  descriptive:  "Descriptive",
  classifying:  "Classifying",
  relational:   "Relational",
  temporal:     "Temporal",
  numeric:      "Numeric",
  provenance:   "Provenance",
  structural:   "Structural",
  media:        "Media",
};

interface RoleIconProps extends LucideProps {
  role: PredicateRole | undefined;
}

/**
 * Renders the icon for a predicate role, with an accessible aria-label.
 * Falls back to `HelpCircle` when `role` is undefined.
 */
export function RoleIcon({ role, className, ...props }: RoleIconProps) {
  const Icon = role ? ROLE_ICON[role] : HelpCircle;
  const colour = role ? ROLE_COLOUR[role] : "text-muted-foreground";
  const label = role ? ROLE_LABEL[role] : "Unknown role";

  return (
    <Icon
      aria-label={`Role: ${label}`}
      className={cn("h-3 w-3 shrink-0", colour, className)}
      {...props}
    />
  );
}
