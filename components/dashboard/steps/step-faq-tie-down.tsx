"use client";

import { CheckCircle2 } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { DashboardFaqItem } from "@/lib/dashboard/types";

const DEFAULT_FAQ: DashboardFaqItem[] = [
  {
    q: "Que se passe-t-il après le paiement ?",
    a: "Nous activons la recherche de demandes correspondant à vos critères dès la complétion de votre onboarding.",
  },
  {
    q: "Combien de temps avant le premier RDV ?",
    a: "Premier RDV honoré sous 21 jours après activation, sous 28 jours selon configuration.",
  },
  {
    q: "Puis-je modifier mes critères ?",
    a: "Oui, contactez votre interlocuteur Hercule pour ajuster votre profil à tout moment.",
  },
];

type StepFaqTieDownProps = {
  items?: DashboardFaqItem[];
};

export function StepFaqTieDown({ items }: StepFaqTieDownProps) {
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

      {/* Tie-down d'intention — read-only display, not a CGV acceptance */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="mb-3 text-sm font-medium">Confirmation d&apos;intention</p>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
          <p className="text-sm leading-snug text-muted-foreground">
            Le fonctionnement d&apos;Hercule (mise en relation qualifiée, 3–4 RDV/mois,
            obligation de moyens) me convient et je souhaite démarrer.
          </p>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Aperçu — l&apos;acceptation formelle des CGV se fait lors de l&apos;onboarding.
        </p>
      </div>

      {/* Onboarding form placeholder — available after payment */}
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Formulaire de configuration — disponible après activation
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          Spécialités · Zone · Capacité · Budget minimum
        </p>
      </div>
    </div>
  );
}
