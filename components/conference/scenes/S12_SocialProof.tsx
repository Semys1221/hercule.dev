"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CASE_STUDIES } from "@/lib/conference/case-studies";
import type { SceneProps } from "../presentation/types";
import { SceneShell } from "../shared/SceneShell";

const EASE = [0.22, 1, 0.36, 1] as const;
const COLUMNS = 6;

export function S12_SocialProof(_props: SceneProps) {
  const withLogo = CASE_STUDIES.firms.filter((firm) => firm.logo.length > 0);
  // A partial last row reads as missing clients: only render full rows.
  const firms = withLogo.slice(0, Math.floor(withLogo.length / COLUMNS) * COLUMNS);

  return (
    <SceneShell className="p-3">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="flex w-[52rem] max-w-full flex-col gap-3"
      >
        <p className="text-center text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
          Les saisons précédentes
        </p>

        {firms.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Les logos des cabinets accompagnés s&apos;affichent ici.
          </p>
        ) : (
          <div className="grid w-full grid-cols-6 gap-1.5">
            {firms.map((firm, index) => (
              <motion.div
                key={firm.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.012, duration: 0.3, ease: EASE }}
                className="flex h-14 min-w-0 items-center justify-center rounded-md bg-card px-2"
              >
                <Image
                  src={firm.logo}
                  alt={firm.name}
                  width={80}
                  height={36}
                  className="max-h-7 w-auto max-w-full object-contain"
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </SceneShell>
  );
}
