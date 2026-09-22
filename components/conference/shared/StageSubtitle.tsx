"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type StageSubtitleProps = Omit<HTMLMotionProps<"p">, "children"> & {
  children: string;
};

export const StageSubtitle = forwardRef<HTMLParagraphElement, StageSubtitleProps>(
  function StageSubtitle({ children, className, ...props }, ref) {
    return (
      <motion.p
        ref={ref}
        {...props}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "max-w-lg text-center text-sm tracking-[0.1em] text-zinc-500",
          className,
        )}
      >
        {children}
      </motion.p>
    );
  },
);
