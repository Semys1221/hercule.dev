"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { HERCULE_MARK_LEFT, HERCULE_MARK_RIGHT } from "@/components/hercule-mark";

type SilverHerculeMarkProps = {
  className?: string;
};

/**
 * Conference-only silver mark. The shared HerculeMark stays currentColor.
 * The two triangles sit on different Z planes so the mark reads as a solid.
 */
export function SilverHerculeMark({ className }: SilverHerculeMarkProps) {
  const uid = useId().replace(/:/g, "");
  const leftId = `hercule-silver-l-${uid}`;
  const rightId = `hercule-silver-r-${uid}`;

  return (
    <div
      className={cn("relative", className)}
      style={{
        transformStyle: "preserve-3d",
        filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.4))",
      }}
      role="img"
      aria-label="Hercule"
    >
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 size-full overflow-visible"
        style={{ transform: "translateZ(8px)" }}
        aria-hidden
      >
        <defs>
          <linearGradient id={leftId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4f4f5" />
            <stop offset="48%" stopColor="#a1a1aa" />
            <stop offset="100%" stopColor="#e4e4e7" />
          </linearGradient>
        </defs>
        <path d={HERCULE_MARK_LEFT} fill={`url(#${leftId})`} />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 size-full overflow-visible"
        style={{ transform: "translateZ(-4px)" }}
        aria-hidden
      >
        <defs>
          <linearGradient id={rightId} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f4f4f5" />
            <stop offset="48%" stopColor="#a1a1aa" />
            <stop offset="100%" stopColor="#e4e4e7" />
          </linearGradient>
        </defs>
        <path d={HERCULE_MARK_RIGHT} fill={`url(#${rightId})`} />
      </svg>
    </div>
  );
}
