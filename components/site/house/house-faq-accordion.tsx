"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { FaqAudience } from "@/lib/site/faq-types"
import { getFaqEntries } from "@/lib/site/faq"

type HouseFaqAccordionProps = {
  audience: FaqAudience
}

export function HouseFaqAccordion({ audience }: HouseFaqAccordionProps) {
  const entries = getFaqEntries(audience)

  return (
    <Accordion type="single" collapsible className="rounded-xl border border-border px-4">
      {entries.map((entry, index) => (
        <AccordionItem key={entry.id} value={`faq-${index}`}>
          <AccordionTrigger className="text-left">{entry.question}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{entry.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
