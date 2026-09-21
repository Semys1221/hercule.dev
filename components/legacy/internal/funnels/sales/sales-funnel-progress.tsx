import { cn } from "@/lib/utils";

type SalesFunnelProgressProps = {
  value: number;
  label?: string;
  showLabel?: boolean;
  className?: string;
};

export function SalesFunnelProgress({
  value,
  label,
  showLabel = false,
  className,
}: SalesFunnelProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  // Format "0/6" → "0 / 6 étapes"
  const formattedLabel = label ? label.replace("/", " / ") + " étapes" : null;

  if (showLabel) {
    return (
      <div
        className={cn("flex items-center gap-2", className)}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={formattedLabel ?? `Progression ${clamped}%`}
      >
        <div className="relative inline-flex size-8 shrink-0 items-center justify-center">
          <svg className="size-8 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
            <circle
              className="stroke-border"
              cx="18"
              cy="18"
              r={radius}
              fill="none"
              strokeWidth="3.5"
            />
            <circle
              className="stroke-primary transition-[stroke-dashoffset] duration-300"
              cx="18"
              cy="18"
              r={radius}
              fill="none"
              strokeWidth="3.5"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
        </div>
        {formattedLabel ? (
          <span className="text-xs text-muted-foreground">{formattedLabel}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn("relative inline-flex size-10 items-center justify-center", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `Progression ${clamped}%`}
    >
      <svg className="size-10 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
        <circle
          className="stroke-border"
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          strokeWidth="3"
        />
        <circle
          className="stroke-primary transition-[stroke-dashoffset] duration-300"
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          strokeWidth="3"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {label ? (
        <span className="absolute text-[10px] font-medium text-foreground">{label}</span>
      ) : null}
    </div>
  );
}
