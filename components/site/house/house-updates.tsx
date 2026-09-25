"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Fragment } from "react"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { HouseEyebrow, HouseHeading, HouseSection } from "@/components/site/house/house-section"
import { HouseReveal } from "@/components/site/house/house-reveal"
import { getHouseUpdates, type HouseAudience } from "@/lib/site/house-copy"

type HouseUpdatesProps = {
  audience: HouseAudience
}

export function HouseUpdates({ audience }: HouseUpdatesProps) {
  const updates = getHouseUpdates(audience)

  return (
    <HouseSection>
      <HouseReveal>
        <HouseEyebrow>Actualités</HouseEyebrow>
        <HouseHeading>Dernières entrées.</HouseHeading>
        <ItemGroup className="mt-10 rounded-xl border border-border">
          {updates.map((item, index) => (
            <Fragment key={item.href}>
              <Item asChild size="sm" variant="outline" className="rounded-none border-0">
                <Link href={item.href}>
                  <ItemContent>
                    <ItemTitle>{item.title}</ItemTitle>
                    <ItemDescription>{item.meta}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </ItemActions>
                </Link>
              </Item>
              {index < updates.length - 1 ? <ItemSeparator /> : null}
            </Fragment>
          ))}
        </ItemGroup>
      </HouseReveal>
    </HouseSection>
  )
}
