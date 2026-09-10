"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { HerculeMark } from "@/components/hercule-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { RESERVATION_BODY_TEXT, RESERVATION_SURFACE } from "@/lib/admin/funnels/reservation-surface";
import { COMPTABLE_MODEL_HIGHLIGHTS, COMPTABLE_PRESENTATION_PARAGRAPHS } from "@/lib/admin/funnels/comptable-sales-copy";
import { getEnterpriseQualificationCriteria } from "@/lib/commercial/qualification-criteria";
import type { Audience } from "@/lib/admin/navigation";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { cn } from "@/lib/utils";

import {
  getPresentationConfirmationText,
} from "./sales-funnel-sections";
import { SalesConfirmationCard } from "./sales-confirmation-card";
import { CompanyOriginTimeline } from "./company-origin-timeline";
import { TeamImageFrame } from "./team-image-frame";

type TeamBullet = {
  highlight: string;
  text: string;
};

type TeamMember = {
  name: string;
  role: string;
  history: TeamBullet[];
};

const TEAM: TeamMember[] = [
  {
    name: "Evan",
    role: "Développeur senior — direction technique.",
    history: [
      {
        highlight: "Mandat d'auditeur principal",
        text: "— dialogue de pair technique sur développement, acquisition et livraison.",
      },
      {
        highlight: "Critères de performance",
        text: "— pérennité des mandats et minimisation des chargebacks.",
      },
      {
        highlight: "Disponibilités limitées",
        text: "— admission ou refus du dossier traitée de manière neutre.",
      },
    ],
  },
  {
    name: "Béatrice",
    role: "Qualification des demandes et relation avec les agences partenaires.",
    history: [
      {
        highlight: "Premier filtre",
        text: "— qualification de chaque demande avant transmission au réseau d'agences.",
      },
      {
        highlight: "Relation partenaires",
        text: "— suivi des agences et alignement sur les critères de compatibilité.",
      },
      {
        highlight: "Interface prospects",
        text: "— premier contact humain avant passage au commercial.",
      },
    ],
  },
  {
    name: "Thomas",
    role: "Produit et opérations techniques.",
    history: [
      {
        highlight: "Plateforme produit",
        text: "— conception et évolution des outils d'attribution des demandes.",
      },
      {
        highlight: "Opérations techniques",
        text: "— fiabilité des parcours client-agence et maintenance des systèmes.",
      },
      {
        highlight: "Automatisation",
        text: "— réduction des délais de traitement via des processus outillés.",
      },
    ],
  },
];

const COMPTABLE_TEAM: TeamMember[] = [
  {
    name: "Evan",
    role: "Développeur senior — direction technique.",
    history: [
      {
        highlight: "Mandat d'auditeur principal",
        text: "— dialogue de pair technique sur compatibilité cabinet-TPE et livraison.",
      },
      {
        highlight: "Critères de performance",
        text: "— pérennité des mandats et minimisation des incompatibilités mission.",
      },
      {
        highlight: "Disponibilités limitées",
        text: "— admission ou refus du dossier traitée de manière neutre.",
      },
    ],
  },
  {
    name: "Béatrice",
    role: "Qualification des demandes TPE et relation avec les cabinets partenaires.",
    history: [
      {
        highlight: "Premier filtre",
        text: "— qualification de chaque demande TPE avant transmission au réseau de cabinets.",
      },
      {
        highlight: "Relation partenaires",
        text: "— suivi des cabinets et alignement sur les critères de compatibilité.",
      },
      {
        highlight: "Interface dirigeants",
        text: "— premier contact humain avant passage au commercial.",
      },
    ],
  },
  {
    name: "Thomas",
    role: "Produit et opérations techniques.",
    history: [
      {
        highlight: "Plateforme produit",
        text: "— conception et évolution des outils d'attribution des missions TPE.",
      },
      {
        highlight: "Opérations techniques",
        text: "— fiabilité des parcours cabinet-dirigeant et maintenance des systèmes.",
      },
      {
        highlight: "Automatisation",
        text: "— réduction des délais de traitement via des processus outillés.",
      },
    ],
  },
];

const MODEL_HIGHLIGHTS = [
  {
    title: "20+",
    description: "signaux par jour capturés par nos algorithmes et qualifiées par notre équipe.",
  },
  {
    title: "Audit partenaire",
    description: "avant toute attribution pour garantir la compatibilité client-agence.",
  },
  {
    title: "0 %",
    description: "de commission sur vos ventes — vous encaissez à vos tarifs.",
  },
] as const;

type SalesCompanyPresentationPanelProps = {
  audience?: Audience;
  form: UseFormReturn<SalesQualificationValues>;
};

export function SalesCompanyPresentationPanel({
  audience = "agence",
  form,
}: SalesCompanyPresentationPanelProps) {
  const isComptable = audience === "comptable";
  const isEntreprise = audience === "entreprise";
  const teamMembers = isComptable ? COMPTABLE_TEAM : TEAM;
  const modelHighlights = isComptable ? COMPTABLE_MODEL_HIGHLIGHTS : MODEL_HIGHLIGHTS;
  const qualificationCriteria = getEnterpriseQualificationCriteria(audience);
  const cvgHref = isComptable ? "/cvg/comptable" : "/cvg";
  return (
    <div className="mx-auto w-full max-w-3xl space-y-12 text-left">
      <div className="flex justify-center">
        <div className="flex items-center gap-3">
          <HerculeMark variant="dual" className="size-10 text-foreground" />
          <span className="text-2xl font-semibold text-foreground">
            {isComptable ? "Hercule Comptable" : "Hercule"}
          </span>
        </div>
      </div>

      <TeamImageFrame />

      <div className={cn("space-y-5 text-[15px] leading-[1.65]", RESERVATION_BODY_TEXT)}>
        {isEntreprise ? (
          <p>
            Actuellement, nous opérons sous le statut de micro-entreprise collaborative avec une
            équipe de 3 experts dédiés, ce qui nous permet de vous offrir une flexibilité totale et
            zéro frais de structure cachés. Nos prix sont nets.
          </p>
        ) : (
          <>
            {isComptable ? (
              COMPTABLE_PRESENTATION_PARAGRAPHS.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))
            ) : (
              <>
                <p>
                  Hercule est l&apos;évolution d&apos;un outil interne que nous utilisons depuis 2018
                  pour notre propre activité de développement backend. Renommé Hercule en 2025, ce
                  socle est devenu la plateforme que nous présentons aujourd&apos;hui.
                </p>
                <p>
                  Aujourd&apos;hui, nous générons plus de 20 contrats par mois dans différents
                  secteurs. Nous auditons et qualifions les agences partenaires pour mettre en relation
                  ces demandes avec les profils les plus compatibles.
                </p>
              </>
            )}
          </>
        )}
      </div>

      <CompanyOriginTimeline audience={audience} />

      <section className="space-y-5">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Notre modèle</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {modelHighlights.map((item) => (
            <Card key={item.title} className={cn(RESERVATION_SURFACE, "shadow-none")}>
              <CardContent className="space-y-2 p-5">
                <p className="text-lg font-semibold text-foreground">{item.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-xl font-medium tracking-tight text-foreground">
            Critères de qualification
          </h2>
          <p className={cn("text-[15px] leading-[1.65]", RESERVATION_BODY_TEXT)}>
            {isComptable
              ? "Chaque demande TPE est validée par appel téléphonique (Live Qualification) selon les cinq critères définis dans nos CGV avant toute attribution à un cabinet partenaire."
              : "Chaque demande entreprise est validée par appel téléphonique (Live Qualification) selon les cinq critères définis dans nos CGV avant toute attribution à une agence partenaire."}
          </p>
        </div>
        <Card className={cn(RESERVATION_SURFACE, "shadow-none")}>
          <CardContent className="divide-y divide-border p-0">
            {qualificationCriteria.map((criterion) => (
              <div key={criterion.title} className="space-y-1 px-5 py-4 md:px-6 md:py-5">
                <p className="font-medium text-foreground">{criterion.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {criterion.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-medium tracking-tight text-foreground">L&apos;équipe</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {teamMembers.map((member) => (
            <Collapsible key={member.name} className="group/collapsible">
              <Card className={cn(RESERVATION_SURFACE, "shadow-none")}>
                <CardContent className="p-5">
                  <CollapsibleTrigger
                    className="flex w-full cursor-pointer items-start justify-between gap-2 text-left transition-colors hover:text-foreground"
                  >
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">{member.role}</p>
                    </div>
                    <ChevronDown
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180"
                      aria-hidden
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Cadre d&apos;intervention
                    </p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-snug text-muted-foreground">
                      {member.history.map((bullet) => (
                        <li key={bullet.highlight}>
                          <span className="font-medium text-foreground">{bullet.highlight}</span>
                          {" "}
                          {bullet.text}
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href={cvgHref} target="_blank" rel="noopener noreferrer">
            Lire les CGV
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/a-propos" target="_blank" rel="noopener noreferrer">
            En savoir plus
          </Link>
        </Button>
      </div>

      <FormField
        control={form.control}
        name="presentationConfirmed"
        render={({ field }) => (
          <FormItem>
            <SalesConfirmationCard
              id="sales-presentation-confirmed"
              label={getPresentationConfirmationText(audience)}
              description="Cette étape est requise avant de poursuivre la qualification."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
