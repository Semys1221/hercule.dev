"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SceneLabel } from "./SceneLabel";

const STAGGER = 0.4;
const EASE = [0.22, 1, 0.36, 1] as const;

export type QualificationCheck = {
  label: string;
  /** Empty box that appears, then fades out. Defaults to checked. */
  checked?: boolean;
};

type QualificationChecklistProps = {
  niche: string;
  problem?: string;
  items: QualificationCheck[];
  footnote?: string;
  /** compact: niche and checks on one row. stacked: a full slide. */
  layout?: "stacked" | "compact";
  delay?: number;
  className?: string;
};

function CheckRow({
  label,
  checked,
  delay,
}: {
  label: string;
  checked: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={checked ? { opacity: 0, y: 8 } : { opacity: 0, height: 0 }}
      animate={
        checked
          ? { opacity: 1, y: 0 }
          : { opacity: [0, 1, 1, 0], height: [0, "auto", "auto", 0] }
      }
      transition={
        checked
          ? { delay, duration: 0.35, ease: EASE }
          : { delay, duration: 1.7, times: [0, 0.18, 0.62, 1], ease: "easeInOut" }
      }
      className="overflow-hidden"
    >
      <div className="flex items-center gap-3 py-0.5">
        <span
          aria-hidden
          className={cn(
            "flex size-4 shrink-0 items-center justify-center border text-[11px] leading-none",
            checked ? "border-foreground/40 text-foreground" : "border-border text-transparent",
          )}
        >
          {checked ? "✓" : ""}
        </span>
        <span
          className={cn(
            "text-sm tracking-[0.02em]",
            checked ? "text-foreground" : "text-muted-foreground line-through",
          )}
        >
          {label}
        </span>
      </div>
    </motion.div>
  );
}

export function QualificationChecklist({
  niche,
  problem,
  items,
  footnote,
  layout = "stacked",
  delay = 0,
  className,
}: QualificationChecklistProps) {
  const compact = layout === "compact";

  return (
    <div
      className={cn(
        compact ? "flex items-center gap-6" : "flex flex-col items-start gap-4",
        className,
      )}
    >
      <SceneLabel size={compact ? "xs" : "sm"} animate={false}>
        {niche}
      </SceneLabel>
      {problem ? (
        <p className="max-w-lg text-sm tracking-[0.04em] text-muted-foreground">{problem}</p>
      ) : null}
      <div className={cn(compact ? "flex items-center gap-5" : "flex flex-col")}>
        {items.map((item, index) => (
          <CheckRow
            key={item.label}
            label={item.label}
            checked={item.checked !== false}
            delay={delay + index * STAGGER}
          />
        ))}
      </div>
      {footnote ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + items.length * STAGGER, duration: 0.4 }}
          className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase"
        >
          {footnote}
        </motion.p>
      ) : null}
    </div>
  );
}
