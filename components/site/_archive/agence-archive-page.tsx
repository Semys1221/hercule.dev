"use client"

import Link from "next/link"

import { Footer } from "@/components/site/home/footer"
import { HouseAtmosphere } from "@/components/site/home/house-atmosphere"
import { Navbar } from "@/components/site/home/navbar"
import { marketingPageShellClassName } from "@/lib/site/marketing-layout"
import { getMarketingCopy } from "@/lib/site/marketing-copy"

export function AgenceArchivePage() {
  const copy = getMarketingCopy("agence")

  return (
    <>
      <Navbar />
      <HouseAtmosphere />
      <div className="bg-background">
        <section className="house-archive-section border-b border-border py-16">
          <div className={marketingPageShellClassName()}>
            <h1 className="text-4xl font-medium leading-[1.1] text-balance text-foreground md:text-5xl lg:text-[56px]">
              {copy.hero.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg text-muted-foreground">{copy.hero.subtitle}</p>
            <p className="mt-8 text-sm text-muted-foreground">
              {copy.bandeStack.text}{" "}
              <span className="text-foreground">{copy.bandeStack.subtext}</span>
            </p>
            <p className="mt-6 text-sm">
              <Link
                href="/agence/faq"
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                FAQ agence
              </Link>
            </p>
          </div>
        </section>
        <Footer />
      </div>
    </>
  )
}
