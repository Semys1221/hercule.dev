"use client"

import { motion, type HTMLMotionProps } from "framer-motion"

import { cn } from "@/lib/utils"

type HouseRevealProps = HTMLMotionProps<"div"> & {
  className?: string
}

export function HouseReveal({ className, children, ...props }: HouseRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
