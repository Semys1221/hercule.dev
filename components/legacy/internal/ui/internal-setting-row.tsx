import { cn } from "@/lib/utils";

type InternalSettingRowProps = {
  title: string;
  description?: string;
  control: React.ReactNode;
  className?: string;
};

export function InternalSettingRow({
  title,
  description,
  control,
  className,
}: InternalSettingRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-card/30 px-4 py-4",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
