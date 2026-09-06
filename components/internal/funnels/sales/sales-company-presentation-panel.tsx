"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { HerculeMark } from "@/components/hercule-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { LEGAL_ENTITY } from "@/lib/constants";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";

import { PRESENTATION_CONFIRMATION_TEXT } from "./sales-funnel-sections";
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

const MODEL_HIGHLIGHTS = [
  {
    title: "20+",
    description: "demandes qualifiées par mois dans différents secteurs.",
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
  form: UseFormReturn<SalesQualificationValues>;
};

export function SalesCompanyPresentationPanel({ form }: SalesCompanyPresentationPanelProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 text-left">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <HerculeMark variant="dual" className="size-8 text-foreground" />
          <span className="text-lg font-semibold text-foreground">Hercule</span>
        </div>
        <h1 className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          La société Hercule
        </h1>
      </div>

      <TeamImageFrame />

      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Hercule est l&apos;évolution d&apos;un outil interne que nous utilisons depuis 2018 pour
          notre propre activité de développement backend. Renommé Hercule en 2025, ce socle est
          devenu la plateforme que nous présentons aujourd&apos;hui.
        </p>
        <p>
          Aujourd&apos;hui, nous générons plus de 20 demandes clients qualifiées par mois dans
          différents secteurs. Nous auditons et qualifions les agences partenaires pour mettre en
          relation ces demandes avec les profils les plus compatibles.
        </p>
      </div>

      <CompanyOriginTimeline />

      <section className="space-y-4">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Notre modèle</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {MODEL_HIGHLIGHTS.map((item) => (
            <Card key={item.title} className="border-border bg-card/40 shadow-none">
              <CardContent className="space-y-2 p-5">
                <p className="text-lg font-semibold text-foreground">{item.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium tracking-tight text-foreground">L&apos;équipe</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TEAM.map((member) => (
            <Collapsible key={member.name} className="group/collapsible">
              <Card className="border-border bg-card/40 shadow-none">
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

      <Card className="border-border bg-card/40 shadow-none">
        <CardContent className="space-y-2 p-5 text-sm leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">
            {LEGAL_ENTITY.legalName} — {LEGAL_ENTITY.tradeName}
          </p>
          <p>{LEGAL_ENTITY.rcs}</p>
          <p>{LEGAL_ENTITY.address}</p>
          <p>Nom de domaine acquis : {LEGAL_ENTITY.website}</p>
          <p>TVA : immatriculation en cours sur la société.</p>
          <p>Dirigeant : {LEGAL_ENTITY.director}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/cvg" target="_blank" rel="noopener noreferrer">
            Lire les CGV
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/a-propos" target="_blank" rel="noopener noreferrer">
            En savoir plus
          </Link>
        </Button>
      </div>

      <Card className="gap-0 py-0 shadow-none">
        <CardContent className="p-0">
          <div className="px-4 py-2.5 md:px-5 md:py-3">
            <FormField
              control={form.control}
              name="presentationConfirmed"
              render={({ field }) => (
                <FormItem>
                  <FieldSet className="gap-2">
                    <FieldLegend className="mb-1 text-sm font-medium">Confirmation</FieldLegend>
                    <FieldGroup>
                      <Field orientation="horizontal">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                          />
                        </FormControl>
                        <div className="space-y-0.5">
                          <FieldLabel className="text-sm font-normal leading-snug">
                            {PRESENTATION_CONFIRMATION_TEXT}
                          </FieldLabel>
                          <FieldDescription className="text-xs">
                            Cette étape est requise avant de poursuivre la qualification.
                          </FieldDescription>
                        </div>
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
