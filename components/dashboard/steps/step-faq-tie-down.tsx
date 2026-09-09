"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FaqRichText } from "@/components/dashboard/faq-rich-text";
import { getOnboardingFaq } from "@/lib/dashboard/onboarding-faq";
import type { DashboardFaqAudience } from "@/lib/dashboard/types";

type StepFaqTieDownProps = {
  audience?: DashboardFaqAudience;
  tieDownAccepted: boolean;
  onTieDownChange: (accepted: boolean) => void;
  tieDownId?: string;
};

export function StepFaqTieDown({
  audience = "agence",
  tieDownAccepted,
  onTieDownChange,
  tieDownId = "tie-down-intention",
}: StepFaqTieDownProps) {
  const config = getOnboardingFaq(audience);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-medium">Questions fréquentes</h2>
        <p className="mt-1 text-sm text-muted-foreground">{config.subtitle}</p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {config.items.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger className="text-sm">{item.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <FaqRichText text={item.a} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id={tieDownId}
            checked={tieDownAccepted}
            onCheckedChange={(checked) => onTieDownChange(checked === true)}
            className="mt-0.5 size-5 border-2 border-foreground/40 bg-background shadow-sm"
          />
          <Label
            htmlFor={tieDownId}
            className="cursor-pointer text-sm leading-snug font-normal"
          >
            <FaqRichText text={config.tieDown} />
          </Label>
        </div>
      </div>
    </div>
  );
}
