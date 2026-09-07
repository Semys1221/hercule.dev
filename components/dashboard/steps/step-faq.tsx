"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { DashboardFaqItem } from "@/lib/dashboard/types";

const DEFAULT_FAQ: DashboardFaqItem[] = [
  {
    q: "Comment fonctionne la mise en relation ?",
    a: "Hercule vous attribue 5 demandes qualifiées selon vos critères d'éligibilité. 0 % de commission sur vos ventes. Si aucune signature n'est conclue, la garantie Starter prévoit 5 rendez-vous supplémentaires.",
  },
  {
    q: "Puis-je modifier mes critères ?",
    a: "Oui, contactez votre interlocuteur Hercule pour ajuster votre profil.",
  },
  {
    q: "Quand recevrai-je ma première demande ?",
    a: "Dès qu'une opportunité correspond à votre capacité et à vos spécialités.",
  },
];

type StepFaqProps = {
  items?: DashboardFaqItem[];
};

export function StepFaq({ items }: StepFaqProps) {
  const faqItems = items?.length ? items : DEFAULT_FAQ;

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
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
