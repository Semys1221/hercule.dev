"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FaqRichText } from "@/components/dashboard/faq-rich-text";
import { getOnboardingFaq, onboardingFaqToDashboardItems } from "@/lib/dashboard/onboarding-faq";
import type { DashboardFaqAudience, DashboardFaqItem } from "@/lib/dashboard/types";

const DEFAULT_FAQ: DashboardFaqItem[] = onboardingFaqToDashboardItems(
  getOnboardingFaq("agence"),
);

type StepFaqProps = {
  audience?: DashboardFaqAudience;
  items?: DashboardFaqItem[];
};

export function StepFaq({ audience = "agence", items }: StepFaqProps) {
  const fallback =
    audience === "agence"
      ? DEFAULT_FAQ
      : onboardingFaqToDashboardItems(getOnboardingFaq(audience));
  const faqItems = items?.length ? items : fallback;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">FAQ</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Réponses aux questions les plus fréquentes.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => (
          <AccordionItem key={`${item.q}-${index}`} value={`faq-${index}`}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <FaqRichText text={item.a} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
