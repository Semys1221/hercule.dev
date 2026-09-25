import Link from "next/link"

import { HouseHeroStage } from "@/components/site/house/house-hero-stage"
import { HouseHeroTitle } from "@/components/site/house/house-hero-title"
import { HouseGlassHerculeMark } from "@/components/site/house/house-glass-hercule-mark"
import { marketingPageShellClassName } from "@/lib/site/marketing-layout"
import { getHouseHero, HOUSE_HERO_LINKS, type HouseAudience } from "@/lib/site/house-copy"

type HouseHeroProps = {
  audience?: HouseAudience
}

export function HouseHero({ audience = "home" }: HouseHeroProps) {
  const { title, subtitle } = getHouseHero(audience)

  return (
    <section className="border-b border-border bg-background pt-28 pb-16 md:pb-24">
      <div className={marketingPageShellClassName()}>
        <div className="mb-16 flex justify-center md:mb-24">
          <HouseGlassHerculeMark className="size-24 md:size-28" />
        </div>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-center gap-8 lg:items-start">
            <HouseHeroTitle title={title} subtitle={subtitle} align="startOnLg" />
            {audience === "home" ? (
              <nav
                className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm lg:justify-start"
                aria-label="Rubriques"
              >
                {HOUSE_HERO_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>
          <HouseHeroStage />
        </div>
      </div>
    </section>
  )
}
