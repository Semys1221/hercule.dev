import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const INSTANTLY_BLUE = "#006BFF";
const DATAGOUV_BLUE = "#0063CB";
const CALENDLY_BLUE = "#006BFF";

type FlowMarkProps = {
  className?: string;
};

/** Instantly — disque bleu + éclair blanc (hero ou tuile flux). */
export function InstantlyBoltMark({
  className,
  size = "md",
}: FlowMarkProps & { size?: "sm" | "md" | "lg" }) {
  const px = { sm: 40, md: 48, lg: 96 }[size];

  return (
    <svg
      viewBox="0 0 48 48"
      width={px}
      height={px}
      role="img"
      aria-label="Instantly"
      className={cn("shrink-0", className)}
    >
      <circle cx="24" cy="24" r="24" fill={INSTANTLY_BLUE} />
      <path
        d="M27.5 8.5 14 26h8.5l-2 13.5L34 22h-8.5l2-13.5Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** data.gouv — wordmark + cube isométrique (pas de raster). */
export function DataGouvFlowMark({ className }: FlowMarkProps) {
  return (
    <svg
      viewBox="0 0 132 32"
      role="img"
      aria-label="data.gouv"
      className={cn("h-8 w-auto shrink-0", className)}
    >
      <text
        x="0"
        y="22"
        fill={DATAGOUV_BLUE}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="18"
        fontWeight="700"
      >
        data.gouv
      </text>
      {/* Cube isométrique */}
      <path d="M108 8.5 118 14v11l-10 5.5L98 25V14l10-5.5Z" fill={DATAGOUV_BLUE} opacity="0.35" />
      <path d="M108 8.5 118 14 108 19.5 98 14l10-5.5Z" fill={DATAGOUV_BLUE} opacity="0.55" />
      <path d="M98 14v11l10 5.5V19.5L98 14Z" fill={DATAGOUV_BLUE} />
      <path d="M118 14v11l-10 5.5V19.5L118 14Z" fill={DATAGOUV_BLUE} opacity="0.75" />
    </svg>
  );
}

/** Calendly — wordmark typographique. */
export function CalendlyFlowMark({ className }: FlowMarkProps) {
  return (
    <svg
      viewBox="0 0 108 28"
      role="img"
      aria-label="Calendly"
      className={cn("h-7 w-auto shrink-0", className)}
    >
      <text
        x="0"
        y="22"
        fill={CALENDLY_BLUE}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="22"
        fontWeight="700"
      >
        Calendly
      </text>
    </svg>
  );
}

type FlowNodeShellProps = {
  children: ReactNode;
  featured?: boolean;
  className?: string;
};

/** Tuile blanche du flux avec halo lumineux. */
export function FlowNodeShell({ children, featured = false, className }: FlowNodeShellProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl border bg-white/95 px-4 py-3",
        featured
          ? "border-primary/50 shadow-[0_0_28px_-4px_hsl(var(--primary)/0.45)] animate-[glow-pulse_3s_ease-in-out_infinite]"
          : "border-border/50 shadow-[0_0_18px_-8px_hsl(var(--foreground)/0.12)]",
        className,
      )}
    >
      {featured ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl bg-primary/5 blur-md"
        />
      ) : null}
      <div className="relative">{children}</div>
    </div>
  );
}

/** Hero Instantly avec halo pulsé. */
export function InstantlyHeroMark({ className }: FlowMarkProps) {
  return (
    <div
      className={cn(
        "relative flex size-24 items-center justify-center rounded-full animate-[glow-pulse-lg_3s_ease-in-out_infinite]",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-primary/20 blur-xl"
      />
      <InstantlyBoltMark size="lg" className="relative rounded-full shadow-[0_0_40px_-8px_hsl(var(--primary)/0.55)]" />
    </div>
  );
}
