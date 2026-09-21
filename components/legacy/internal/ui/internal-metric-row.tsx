import { cn } from "@/lib/utils";

type InternalMetric = {
  label: string;
  value: string;
  hint?: string;
};

type InternalMetricRowProps = {
  title: string;
  columns?: 2 | 3 | 4 | 5;
  metrics: InternalMetric[];
  className?: string;
};

const COLUMN_CLASS: Record<NonNullable<InternalMetricRowProps["columns"]>, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 xl:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
};

export function InternalMetricRow({
  title,
  columns = 4,
  metrics,
  className,
}: InternalMetricRowProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className={cn("grid gap-3", COLUMN_CLASS[columns])}>
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-border/60 bg-card/30 px-4 py-3"
          >
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{metric.value}</p>
            {metric.hint ? (
              <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
