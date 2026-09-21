"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type CounterProps = {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
  format?: (v: number) => string;
};

const frFmt = new Intl.NumberFormat("fr-FR");

export function Counter({
  to,
  from = 0,
  duration = 1.2,
  className,
  format = (v) => frFmt.format(Math.round(v)),
}: CounterProps) {
  const mv = useMotionValue(from);
  const display = useTransform(mv, format);

  useEffect(() => {
    const ctrl = animate(mv, to, { duration, ease: "easeOut" });
    return () => ctrl.stop();
  }, [mv, to, duration]);

  return (
    <motion.span className={cn("tabular-nums", className)}>
      {display}
    </motion.span>
  );
}
