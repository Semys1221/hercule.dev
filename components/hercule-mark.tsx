import { cn } from "@/lib/utils"

/** Left triangle: (3,5) → (3,19) → (10.5,12) — apex points right */
export const HERCULE_MARK_LEFT = "M3 5v14l7.5-7L3 5z"

/** Right triangle: (21,5) → (21,19) → (13.5,12) — apex points left */
export const HERCULE_MARK_RIGHT = "M21 5v14l-7.5-7L21 5z"

type HerculeMarkProps = {
  className?: string
  variant?: "dual" | "mono"
  "aria-label"?: string
}

export function HerculeMark({
  className,
  variant = "dual",
  "aria-label": ariaLabel = "Hercule",
}: HerculeMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={ariaLabel}
    >
      <path d={HERCULE_MARK_LEFT} fill="currentColor" />
      <path
        d={HERCULE_MARK_RIGHT}
        fill="currentColor"
        className={variant === "dual" ? "text-zinc-400" : undefined}
      />
    </svg>
  )
}
