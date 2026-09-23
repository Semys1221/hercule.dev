"use client";

import { useEffect, useState } from "react";

type CountdownProps = {
  seconds?: number;
  className?: string;
};

export function Countdown({ seconds = 300, className }: CountdownProps) {
  const [secs, setSecs] = useState(seconds);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return (
    <p className={className ?? "font-mono text-5xl font-thin tabular-nums tracking-widest text-foreground"}>
      {m}:{s}
    </p>
  );
}
