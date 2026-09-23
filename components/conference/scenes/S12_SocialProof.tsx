"use client";

import { motion } from "framer-motion";
import { firmsByCategory, type CaseFirm } from "@/lib/conference/case-studies";
import type { SceneProps } from "../presentation/types";
import { SceneShell } from "../shared/SceneShell";
import { FirmMark } from "./case-proof";

const EASE = [0.22, 1, 0.36, 1] as const;

function LogoGrid({
  label,
  firms,
  startDelay,
}: {
  label: string;
  firms: CaseFirm[];
  startDelay: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">{label}</p>
      <div className="grid grid-cols-5 gap-x-3 gap-y-4">
        {firms.map((firm, index) => (
          <motion.div
            key={firm.slug || firm.logo || firm.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: startDelay + index * 0.02, duration: 0.35, ease: EASE }}
            className="flex flex-col items-center gap-1.5"
          >
            <FirmMark firm={firm} size="sm" />
            <p className="line-clamp-2 text-center text-[10px] leading-tight text-zinc-400">
              {firm.name}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function S12_SocialProof(_props: SceneProps) {
  const accounting = firmsByCategory("accounting");
  const brokerage = firmsByCategory("brokerage");

  return (
    <SceneShell className="px-6 py-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex w-[68rem] max-w-full flex-col gap-8"
      >
        <p className="text-center text-[11px] tracking-[0.22em] text-zinc-500 uppercase">
          Cabinets indépendants
        </p>
        {accounting.length === 0 && brokerage.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Les logos des cabinets accompagnés s’affichent ici.
          </p>
        ) : (
          <>
            <LogoGrid label="Comptabilité" firms={accounting} startDelay={0.05} />
            <LogoGrid label="Courtage · Conseil" firms={brokerage} startDelay={0.2} />
          </>
        )}
      </motion.div>
    </SceneShell>
  );
}
