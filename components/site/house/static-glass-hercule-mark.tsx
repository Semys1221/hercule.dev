import { HERCULE_MARK_LEFT, HERCULE_MARK_RIGHT } from "@/components/hercule-mark"
import { cn } from "@/lib/utils"

type StaticGlassHerculeMarkProps = {
  className?: string
  idPrefix?: string
}

export function StaticGlassHerculeMark({
  className,
  idPrefix = "house-glass",
}: StaticGlassHerculeMarkProps) {
  const leftGlass = `${idPrefix}-l`
  const rightGlass = `${idPrefix}-r`
  const depth = `${idPrefix}-depth`

  return (
    <div
      className={cn("relative", className)}
      role="img"
      aria-label="Hercule"
      style={{ filter: "drop-shadow(0 12px 16px rgba(0, 0, 0, 0.06))" }}
    >
      <svg viewBox="0 0 24 24" className="size-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={leftGlass} x1="0.1" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
            <stop offset="45%" stopColor="#F1F2F4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D6D9DE" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id={rightGlass} x1="0.9" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
            <stop offset="45%" stopColor="#EEF0F2" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D2D5DA" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id={depth} x1="0" y1="0" x2="0" y2="1">
            <stop offset="55%" stopColor="#8A9099" stopOpacity="0" />
            <stop offset="100%" stopColor="#8A9099" stopOpacity="0.28" />
          </linearGradient>
        </defs>
        <path d={HERCULE_MARK_LEFT} fill={`url(#${leftGlass})`} />
        <path d={HERCULE_MARK_RIGHT} fill={`url(#${rightGlass})`} />
        <path d={HERCULE_MARK_LEFT} fill={`url(#${depth})`} />
        <path d={HERCULE_MARK_RIGHT} fill={`url(#${depth})`} />
      </svg>
    </div>
  )
}
