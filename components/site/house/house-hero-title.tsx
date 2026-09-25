"use client"

import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

type HouseHeroTitleProps = {
  title: string
  subtitle: string
  align?: "center" | "startOnLg"
}

export function HouseHeroTitle({ title, subtitle, align = "center" }: HouseHeroTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex flex-col",
        align === "center" && "items-center text-center",
        align === "startOnLg" && "items-center text-center lg:items-start lg:text-left",
      )}
    >
      <h1
        className="text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl"
        style={{ letterSpacing: "-0.04em" }}
      >
        {title}
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted-foreground md:text-xl">{subtitle}</p>
    </motion.div>
  )
}
