"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type SpinningCoinProps = {
  className?: string;
};

const faceClass =
  "absolute inset-0 flex items-center justify-center rounded-full border border-border text-[11px] tracking-[0.22em] text-foreground";

const SPIN_STYLE_ID = "conference-coin-spin";

/** Coin flipping between pile and face. CSS rotation stays off Framer so the beat can exit. */
export function SpinningCoin({ className }: SpinningCoinProps) {
  useEffect(() => {
    if (document.getElementById(SPIN_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = SPIN_STYLE_ID;
    style.textContent =
      "@keyframes conference-coin-spin { to { transform: rotateY(360deg); } }";
    document.head.appendChild(style);
  }, []);

  return (
    <div
      className={cn("relative size-24", className)}
      style={{ perspective: 600 }}
      aria-hidden
    >
      <div
        className="relative size-full"
        style={{
          transformStyle: "preserve-3d",
          animation: "conference-coin-spin 1.4s linear infinite",
        }}
      >
        <div
          className={cn(faceClass, "bg-card")}
          style={{ backfaceVisibility: "hidden" }}
        >
          PILE
        </div>
        <div
          className={cn(faceClass, "bg-muted")}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          FACE
        </div>
      </div>
    </div>
  );
}
