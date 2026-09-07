"use client";

import { Monitor } from "lucide-react";
import { useSyncExternalStore } from "react";

import { DASHBOARD_SCREEN_SHARE_PROMPT } from "@/lib/dashboard/copy";

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function MonitorPulseRings({ animate }: { animate: boolean }) {
  if (!animate) {
    return null;
  }

  return (
    <>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full border border-primary/35 animate-ping"
          style={{
            animationDuration: "2.4s",
            animationDelay: `${index * 0.8}s`,
          }}
        />
      ))}
    </>
  );
}

export function ScreenSharePrompt() {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const shouldAnimate = !reducedMotion;

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-6">
      <div className="w-36 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex h-5 items-center gap-1 border-b border-border bg-muted/40 px-2">
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
        </div>
        <div className="flex h-24 items-center justify-center overflow-visible bg-muted/30 py-3">
          <div className="relative size-10">
            <MonitorPulseRings animate={shouldAnimate} />
            <Monitor
              className="relative z-10 size-10 text-muted-foreground"
              aria-hidden
            />
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{DASHBOARD_SCREEN_SHARE_PROMPT}</p>
    </div>
  );
}
