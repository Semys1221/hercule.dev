"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Monitor } from "lucide-react";

import { DASHBOARD_SCREEN_SHARE_PROMPT } from "@/lib/dashboard/copy";

function PulseRings({ animate }: { animate: boolean }) {
  if (!animate) {
    return (
      <span
        aria-hidden
        className="absolute inset-0 rounded-2xl border border-primary/20"
      />
    );
  }

  return (
    <>
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          aria-hidden
          className="absolute inset-0 rounded-2xl border border-primary/30"
          animate={{ scale: [1, 1.35 + index * 0.15], opacity: [0.5, 0] }}
          transition={{
            repeat: Infinity,
            duration: 2.4,
            delay: index * 0.6,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
}

export function ScreenSharePrompt() {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = !reducedMotion;

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-6">
      <div className="relative flex size-40 items-center justify-center">
        <PulseRings animate={shouldAnimate} />

        <div className="relative z-10 w-36 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex h-5 items-center gap-1 border-b border-border bg-muted/40 px-2">
            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
          </div>
          <div className="flex h-24 items-center justify-center bg-muted/30">
            <Monitor
              className={`size-10 text-muted-foreground ${
                shouldAnimate ? "animate-pulse" : ""
              }`}
              aria-hidden
            />
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{DASHBOARD_SCREEN_SHARE_PROMPT}</p>
    </div>
  );
}
