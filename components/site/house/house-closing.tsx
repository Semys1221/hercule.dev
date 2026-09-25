"use client"

import { HouseReveal } from "@/components/site/house/house-reveal"
import { marketingPageShellClassName } from "@/lib/site/marketing-layout"
import { HOUSE_CLOSING } from "@/lib/site/house-copy"

export function HouseClosing() {
  return (
    <section className="house-archive-section bg-foreground py-24 text-background md:py-32">
      <div className={marketingPageShellClassName()}>
        <HouseReveal>
          <h2
            className="text-3xl font-medium tracking-tight md:text-5xl"
            style={{ letterSpacing: "-0.04em" }}
          >
            {HOUSE_CLOSING.title}
          </h2>
          <p className="mt-4 text-lg text-background/80">{HOUSE_CLOSING.line}</p>
        </HouseReveal>
      </div>
    </section>
  )
}
