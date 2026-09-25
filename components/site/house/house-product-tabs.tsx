"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HouseEyebrow, HouseHeading, HouseSection } from "@/components/site/house/house-section"
import { HouseReveal } from "@/components/site/house/house-reveal"
import { StageSplit } from "@/components/site/house/stage/stage-split"
import { StageTabScene } from "@/components/site/house/stage/stage-tab-scene"
import { getHouseProductTabs, type HouseAudience } from "@/lib/site/house-copy"

type HouseProductTabsProps = {
  audience: HouseAudience
  defaultTab?: string
}

export function HouseProductTabs({ audience, defaultTab = "comptable" }: HouseProductTabsProps) {
  const tabs = getHouseProductTabs(audience)
  const [active, setActive] = useState(defaultTab)

  return (
    <HouseSection>
      <HouseReveal>
        <HouseEyebrow>Produits</HouseEyebrow>
        <HouseHeading>{tabs.intro}</HouseHeading>
        <Tabs value={active} onValueChange={setActive} className="mt-12">
          <TabsList className="h-auto flex-wrap gap-1 bg-muted p-1">
            {tabs.items.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.items.map((item) => (
            <TabsContent key={item.id} value={item.id} className="mt-8">
              <StageSplit
                lead={
                  <>
                    <Badge variant="secondary">{item.label}</Badge>
                    <p className="text-lg text-muted-foreground">{item.body}</p>
                  </>
                }
                stage={active === item.id ? <StageTabScene tabId={item.id} /> : null}
              />
            </TabsContent>
          ))}
        </Tabs>
      </HouseReveal>
    </HouseSection>
  )
}
