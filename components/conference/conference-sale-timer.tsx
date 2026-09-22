"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const TIMER_SECONDS = 300;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export type ConferenceSaleTimerProps = {
  running: boolean;
  className?: string;
};

export function ConferenceSaleTimer({
  running,
  className,
}: ConferenceSaleTimerProps) {
  const [remaining, setRemaining] = useState(TIMER_SECONDS);

  useEffect(() => {
    if (!running) {
      setRemaining(TIMER_SECONDS);
      return;
    }

    setRemaining(TIMER_SECONDS);
    const id = setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <p
      className={cn(
        "font-mono text-sm tracking-[0.2em] text-zinc-500 tabular-nums uppercase",
        className,
      )}
      aria-live={running ? "polite" : "off"}
    >
      {formatCountdown(running ? remaining : TIMER_SECONDS)}
    </p>
  );
}
