import { cn } from "@/lib/utils";

type InternalSectionProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function InternalSection({
  title,
  description,
  actions,
  children,
  className,
}: InternalSectionProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
