"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DashboardFaqItem } from "@/lib/dashboard/types";

export const DEFAULT_FAQ: DashboardFaqItem[] = [
  {
    q: "Comment fonctionne la mise en relation ?",
    a: "Hercule vous attribue 5 demandes qualifiées selon vos critères d'éligibilité. 0 % de commission sur vos ventes. Si aucune signature n'est conclue, la garantie Starter prévoit 5 rendez-vous supplémentaires.",
  },
  {
    q: "Combien de temps avant le premier RDV ?",
    a: "Premier RDV honoré sous 21 jours dès validation de votre profil, sous 28 jours selon configuration.",
  },
  {
    q: "Puis-je modifier mes critères ?",
    a: "Oui, contactez votre interlocuteur Hercule pour ajuster votre profil à tout moment.",
  },
];

type StepFaqTieDownProps = {
  items?: DashboardFaqItem[];
  tieDownAccepted: boolean;
  onTieDownChange: (accepted: boolean) => void;
};

export function StepFaqTieDown({
  items,
  tieDownAccepted,
  onTieDownChange,
}: StepFaqTieDownProps) {
  const faqItems = items?.length ? items : DEFAULT_FAQ;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-medium">Questions fréquentes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ce que nos partenaires agences nous demandent le plus souvent.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => (
          <AccordionItem key={`${item.q}-${index}`} value={`faq-${index}`}>
            <AccordionTrigger className="text-sm">{item.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="tie-down-intention"
            checked={tieDownAccepted}
            onCheckedChange={(checked) => onTieDownChange(checked === true)}
          />
          <Label
            htmlFor="tie-down-intention"
            className="cursor-pointer text-sm leading-snug font-normal"
          >
            Le fonctionnement d&apos;Hercule (5 attributions qualifiées, garantie 5 RDV si pas
            de signature, obligation de moyens) me convient et je souhaite démarrer.
          </Label>
        </div>
      </div>
    </div>
  );
}
