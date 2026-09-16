import { cn } from "@/lib/utils";

export type SegmentRow = {
  label: string;
  value: number;
  total: number;
  className?: string;
  displayValue?: string;
  hidePercent?: boolean;
  animate?: boolean;
};

type AgenceReventeSegmentBarsProps = {
  rows: SegmentRow[];
  headline?: string;
  subtitle?: string;
};

export function AgenceReventeSegmentBars({
  rows,
  headline,
  subtitle,
}: AgenceReventeSegmentBarsProps) {
  return (
    <div className="space-y-4">
      {headline ? (
        <div className="space-y-1">
          <p className="text-sm font-medium">{headline}</p>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      ) : null}
      {rows.map((row) => {
        const pct = row.total > 0 ? Math.round((row.value / row.total) * 100) : 0;
        const width = row.total > 0 ? Math.min(100, (row.value / row.total) * 100) : 0;
        return (
          <div
            key={row.label}
            className={cn(
              "grid gap-2 sm:grid-cols-[minmax(140px,1.4fr)_2fr_auto] sm:items-center",
              row.animate &&
                "animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500",
            )}
          >
            <p className="text-sm text-foreground">{row.label}</p>
            <div className="h-2.5 overflow-hidden rounded-full border border-border bg-muted">
              <div
                className={cn("h-full min-w-1 rounded-full", row.className ?? "bg-primary")}
                style={{ width: `${width}%` }}
              />
            </div>
            <div className="flex items-baseline gap-2 text-sm whitespace-nowrap">
              <strong>{row.displayValue ?? row.value}</strong>
              {!row.hidePercent ? (
                <span className="text-muted-foreground">{pct} %</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
