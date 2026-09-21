import { cn } from "@/lib/utils";

const INK = "#000000";
const PAPER = "#FFFFFF";

type StickerScenePaperProps = {
  typedName: string;
  isTyping: boolean;
  className?: string;
};

/** Notion-style paper + laptop overlay (name is dynamic, stays outside Rive). */
export function StickerScenePaper({
  typedName,
  isTyping,
  className,
}: StickerScenePaperProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      aria-hidden
    >
      <ellipse cx="200" cy="276" rx="130" ry="10" fill={INK} opacity="0.07" />

      <g>
        <rect
          x="48"
          y="186"
          width="304"
          height="92"
          rx="4"
          fill={PAPER}
          stroke={INK}
          strokeWidth="2.5"
        />
        <path
          d="M316 186 L352 186 L352 222 L316 188 Z"
          fill={PAPER}
          stroke={INK}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {[204, 218, 232, 246, 260].map((y) => (
          <line
            key={y}
            x1="68"
            y1={y}
            x2="332"
            y2={y}
            stroke={INK}
            strokeWidth="1"
            opacity="0.12"
          />
        ))}
      </g>

      <g>
        <rect
          x="138"
          y="198"
          width="124"
          height="10"
          rx="3"
          fill={PAPER}
          stroke={INK}
          strokeWidth="2"
        />
        <rect
          x="144"
          y="174"
          width="112"
          height="26"
          rx="4"
          fill={PAPER}
          stroke={INK}
          strokeWidth="2.5"
        />
        <rect
          x="152"
          y="180"
          width="96"
          height="16"
          rx="2"
          fill={PAPER}
          stroke={INK}
          strokeWidth="1.5"
        />
        <text
          x="160"
          y="192"
          fill={INK}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize="10"
          fontWeight="700"
        >
          {typedName}
          {isTyping ? <tspan opacity="0.4">|</tspan> : null}
        </text>
      </g>
    </svg>
  );
}
