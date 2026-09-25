import { cn } from "@/lib/utils"
import { marketingPageShellClassName } from "@/lib/site/marketing-layout"

type HouseSectionProps = {
  id?: string
  variant?: "default" | "muted"
  className?: string
  children: React.ReactNode
}

export function HouseSection({
  id,
  variant = "default",
  className,
  children,
}: HouseSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "house-archive-section py-24 md:py-32",
        variant === "muted" && "bg-muted",
        className,
      )}
    >
      <div className={marketingPageShellClassName()}>{children}</div>
    </section>
  )
}

export function HouseEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-medium tracking-wide text-muted-foreground">{children}</p>
  )
}

export function HouseHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mt-3 max-w-3xl text-balance text-3xl font-medium tracking-tight text-foreground md:text-5xl"
      style={{ letterSpacing: "-0.04em" }}
    >
      {children}
    </h2>
  )
}
