"use client";

import { motion } from "framer-motion";
import { HerculeLogo } from "../shared/HerculeLogo";

const EASE = [0.22, 1, 0.36, 1] as const;

export function ConferenceSplash() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="absolute inset-0 z-[3] flex items-center justify-center"
    >
      <HerculeLogo size="xl" showName />
    </motion.div>
  );
}
