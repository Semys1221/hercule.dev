"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { CaseFirm, FeaturedCase } from "@/lib/conference/case-studies";

const EASE = [0.22, 1, 0.36, 1] as const;

export function FirmMark({
  firm,
  size = "lg",
}: {
  firm: CaseFirm | undefined;
  size?: "lg" | "sm";
}) {
  const large = size === "lg";
  return (
    <div
      className={
        large
          ? "flex h-24 min-w-24 max-w-64 items-center justify-center rounded-2xl bg-card px-4 py-3"
          : "flex h-11 w-full items-center justify-center rounded-md bg-card px-2"
      }
    >
      {firm?.logo ? (
        <Image
          src={firm.logo}
          alt=""
          width={large ? 224 : 72}
          height={large ? 72 : 36}
          className={
            large ? "max-h-16 w-auto max-w-56 object-contain" : "max-h-7 w-auto object-contain"
          }
        />
      ) : (
        <span className={large ? "text-lg text-muted-foreground" : "text-[10px] text-muted-foreground"}>
          {firm?.name?.slice(0, 2).toUpperCase() ?? "—"}
        </span>
      )}
    </div>
  );
}

/** Dirigeant and effectif. Hidden when both strings are blank. */
export function LeaderHeadcount({
  leader,
  headcount,
}: {
  leader: string;
  headcount: string;
}) {
  const parts = [leader.trim(), headcount.trim()].filter((part) => part.length > 0);
  if (parts.length === 0) return null;

  return <p className="text-center text-sm text-muted-foreground">{parts.join(" · ")}</p>;
}

export function CaseNarrative({
  firm,
  activity,
  copy,
  reveal,
}: {
  firm: CaseFirm | undefined;
  activity: string;
  copy: FeaturedCase;
  /** 0 identity, 1 + situation, 2 + action, 3 + résultat. */
  reveal: 0 | 1 | 2 | 3;
}) {
  const rows = [
    { k: "Situation", v: copy.situation },
    { k: "Action", v: copy.action },
    { k: "Résultat", v: copy.resultLine },
  ].slice(0, reveal);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex w-[36rem] max-w-full flex-col items-center gap-8"
    >
      <FirmMark firm={firm} />
      <div className="flex flex-col items-center gap-2">
        <p className="text-center text-xl font-medium tracking-tight text-foreground">
          {firm?.name ?? "Cabinet indépendant"}
        </p>
        <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">{activity}</p>
        <LeaderHeadcount leader={copy.leader} headcount={copy.headcount} />
      </div>
      {rows.length > 0 ? (
      <div className="flex w-full flex-col gap-4">
        {rows.map((row, index) => (
          <motion.div
            key={row.k}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * index, duration: 0.4, ease: EASE }}
            className="grid grid-cols-[7rem_1fr] items-baseline gap-4"
          >
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{row.k}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{row.v}</p>
          </motion.div>
        ))}
      </div>
      ) : null}
    </motion.div>
  );
}

export function ProofFigure({
  value,
  label,
  delay = 0,
  compact = false,
}: {
  value: string;
  label: string;
  delay?: number;
  compact?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: EASE }}
      className="flex flex-col items-center gap-2"
    >
      <p
        className={
          compact
            ? "text-3xl font-medium tracking-tight text-foreground tabular-nums"
            : "text-5xl font-medium tracking-tight text-foreground tabular-nums"
        }
      >
        {value}
      </p>
      <p className="text-center text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{label}</p>
    </motion.div>
  );
}
