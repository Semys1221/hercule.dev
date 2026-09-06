import { Badge } from "@/components/ui/badge";
import {
  COMPONENT_STATUS_LABELS,
  DATABASE_STATUS_LABELS,
  type ComponentStatus,
  type DatabaseStatus,
} from "@/lib/admin/architecture/types";
import { cn } from "@/lib/utils";

const STATUS_VARIANTS: Record<ComponentStatus | DatabaseStatus, string> = {
  built: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  wip: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  spec: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  migrated:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  planned:
    "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
};

type StatusBadgeProps = {
  status: ComponentStatus | DatabaseStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label =
    status in COMPONENT_STATUS_LABELS
      ? COMPONENT_STATUS_LABELS[status as ComponentStatus]
      : DATABASE_STATUS_LABELS[status as DatabaseStatus];

  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-normal", STATUS_VARIANTS[status], className)}
    >
      {label}
    </Badge>
  );
}
