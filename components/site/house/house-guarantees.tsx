"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { HouseHeading, HouseSection } from "@/components/site/house/house-section"
import { HouseReveal } from "@/components/site/house/house-reveal"
import {
  guaranteeKindFromTitle,
  StageGuaranteeVisual,
} from "@/components/site/house/stage/stage-guarantee-visual"
import { getHouseGuarantees, type HouseAudience } from "@/lib/site/house-copy"

type HouseGuaranteesProps = {
  audience: HouseAudience
}

export function HouseGuarantees({ audience }: HouseGuaranteesProps) {
  const guarantees = getHouseGuarantees(audience)

  return (
    <HouseSection id="garanties" variant="muted">
      <HouseReveal>
        <HouseHeading>{guarantees.title}</HouseHeading>
        <Accordion type="single" collapsible className="mt-10 rounded-xl border border-border px-4">
          {guarantees.items.map((item, index) => (
            <AccordionItem key={item.q} value={`g-${index}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.a}
                <StageGuaranteeVisual kind={guaranteeKindFromTitle(item.q)} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </HouseReveal>
    </HouseSection>
  )
}
