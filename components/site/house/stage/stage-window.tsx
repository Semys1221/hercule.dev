import { cn } from "@/lib/utils"

type StageWindowProps = {
  title?: string
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}

export function StageWindow({
  title = "hercule.dev",
  children,
  className,
  bodyClassName,
}: StageWindowProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-background shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </div>
        <span className="truncate text-xs text-muted-foreground">{title}</span>
      </div>
      <div className={cn("p-4 md:p-5", bodyClassName)}>{children}</div>
    </div>
  )
}
