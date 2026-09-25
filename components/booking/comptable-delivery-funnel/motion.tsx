"use client";

import { AnimatePresence, motion } from "framer-motion";

type FunnelStepMotionProps = {
  stepKey: string;
  children: React.ReactNode;
};

export function FunnelStepMotion({ stepKey, children }: FunnelStepMotionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
