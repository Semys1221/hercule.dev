import { Badge } from "@/components/ui/badge";
import {
  COMPONENT_DOMAIN_LABELS,
  DATABASE_DOMAIN_LABELS,
  type ComponentDomain,
  type DatabaseDomain,
} from "@/lib/admin/architecture/types";
import { cn } from "@/lib/utils";

const DOMAIN_VARIANTS: Record<
  ComponentDomain | DatabaseDomain,
  string
> = {
  sales_funnel: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  onboarding_funnel:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  dashboard_internal:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  dashboard_client:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  crm: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  marketing:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
  communication:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  product:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  ai: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200",
  instantly:
    "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

type DomainBadgeProps = {
  domain: ComponentDomain | DatabaseDomain;
  className?: string;
};

export function DomainBadge({ domain, className }: DomainBadgeProps) {
  const label =
    domain in COMPONENT_DOMAIN_LABELS
      ? COMPONENT_DOMAIN_LABELS[domain as ComponentDomain]
      : DATABASE_DOMAIN_LABELS[domain as DatabaseDomain];

  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-normal", DOMAIN_VARIANTS[domain], className)}
    >
      {label}
    </Badge>
  );
}
