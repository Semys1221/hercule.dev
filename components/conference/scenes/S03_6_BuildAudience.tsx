"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { ChapterDoor } from "../shared/ChapterDoor";
import { PhoneIcon } from "../shared/PhoneIcon";
import { SceneShell } from "../shared/SceneShell";

/**
 * S03.6 — Construire une audience  (step 0)
 *
 * Transition : fiche + téléphone entre Point de départ et la prospection froide.
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
              label="CONSTRUIRE UNE AUDIENCE"
              icon={<PhoneIcon size={20} className="text-muted-foreground" />}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </SceneShell>
  );
}
