import { cn } from "@/lib/utils";

type DemandeMetaRowProps = {
  label: string;
  value: string;
  variant?: "marketing" | "internal";
  valueClassName?: string;
};

export function DemandeMetaRow({
  label,
  value,
  variant = "marketing",
  valueClassName,
}: DemandeMetaRowProps) {
  const isMarketing = variant === "marketing";

  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span
        className={cn("shrink-0", isMarketing ? "text-muted-foreground" : "text-muted-foreground")}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-right",
          isMarketing ? "text-foreground" : "text-foreground",
          valueClassName,
        )}
      >
        {value}
      </span>
    </div>
  );
}
