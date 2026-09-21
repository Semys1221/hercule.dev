"use client";

import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqEntry } from "@/lib/site/faq-types";

type FaqPreviewAccordionProps = {
  entries: FaqEntry[];
  className?: string;
};

export function FaqPreviewAccordion({ entries, className }: FaqPreviewAccordionProps) {
  const visibleEntries = entries.filter(
    (entry) => entry.question.trim() && entry.answer.trim(),
  );

  if (visibleEntries.length === 0) {
    return null;
  }

  return (
    <Accordion
      type="single"
      collapsible
      className={className ?? "w-full rounded-lg border px-4"}
      defaultValue={visibleEntries[0]?.id}
    >
      {visibleEntries.map((entry) => (
        <AccordionItem key={entry.id} value={entry.id}>
          <AccordionTrigger>{entry.question}</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {entry.answer}
              {entry.cvgLink && (
                <>
                  {" "}
                  <Link href="/cvg" className="underline underline-offset-2">
                    Voir les CGV
                  </Link>
                </>
              )}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
