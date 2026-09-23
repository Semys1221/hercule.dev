"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { ChapterDoor } from "../shared/ChapterDoor";
import { PhoneIcon } from "../shared/PhoneIcon";
import { SceneShell } from "../shared/SceneShell";

/**
 * S03.6 — Fiche de leads  (step 0)
 *
 * Chapter card that opens the cold-lead sheet, right after the
 * uncontrolled word-of-mouth. The phone sits beside the fiche.
 */
export function S03_6_BuildAudience({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="build-audience"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ChapterDoor
              label="FICHE DE LEADS"
              icon={<PhoneIcon size={20} className="text-muted-foreground" />}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </SceneShell>
  );
}
