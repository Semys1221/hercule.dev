"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { DemandeFlipCard } from "@/components/demandes/demande-flip-card";
import { HerculeMark } from "@/components/hercule-mark";
import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { composeOpportunityCards } from "@/lib/admin/funnels/compose-opportunity-cards";
import {
  formatContractWindow,
  getAgencyPreset,
  type PresetOpportunityCard,
} from "@/lib/admin/funnels/sales-preset-registry";
import {
  scoreAgencyPresets,
  type AgencyPresetResult,
} from "@/lib/admin/funnels/sales-preset-scoring";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { DemandeMetaRow } from "@/components/demandes/demande-meta-row";
import { MaskedContactLine } from "@/components/demandes/masked-contact-line";
import { getSecteurConfig } from "@/lib/agence/secteur-config";
import { cn } from "@/lib/utils";

const REVEAL = {
  LOADING_MS: 1500,
  LOGO_MS: 600,
  COPY_MS: 500,
  CARD_STAGGER_S: 0.35,
  CARD_BASE_DELAY_S: 0.2,
} as const;

type RevealPhase = "loading" | "logo" | "copy" | "cards";

type SalesEligiblePanelProps = {
  qualificationValues: SalesQualificationValues;
  reglesAccepted: boolean;
  developerMode?: boolean;
};

export function SalesPresetSummary({ result }: { result: AgencyPresetResult }) {
  const preset = getAgencyPreset(result.id);
  const Icon = preset.icon;

  return (
    <Card className="border-border bg-card/40 shadow-none">
      <CardHeader className="gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
            <Icon className="size-4 text-foreground" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold tracking-tight">Vous êtes un {preset.name}</p>
            <p className="text-sm text-muted-foreground">{preset.tagline}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>{preset.description}</p>
        {result.reasons.length > 0 ? (
          <p>Classé ainsi car : {result.reasons.join(", ")}.</p>
        ) : (
          <p>Profil par défaut à partir des réponses actuellement renseignées.</p>
        )}
      </CardContent>
    </Card>
  );
}

type OpportunityCardProps = {
  card: PresetOpportunityCard;
  index: number;
  show: boolean;
  reducedMotion: boolean;
  isBlurred: boolean;
  onFlipChange: (flipped: boolean) => void;
};

function OpportunityCard({ card, index, show, reducedMotion, isBlurred, onFlipChange }: OpportunityCardProps) {
  const windowLabel = formatContractWindow(card);
  const { icon: Icon, badgeClass, iconClass, iconBoxClass } = getSecteurConfig(
    card.secteur,
    "internal",
  );

  const cardDelay = reducedMotion
    ? 0
    : REVEAL.CARD_BASE_DELAY_S + index * REVEAL.CARD_STAGGER_S;

  return (
    <motion.div
      className={cn(
        "h-full w-full max-w-[320px] transition-[filter,opacity] duration-300 ease-out",
        isBlurred && "blur-lg opacity-10 pointer-events-none select-none",
      )}
      initial={reducedMotion ? false : { opacity: 0, y: 28, scale: 0.97 }}
      animate={show ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 28, scale: 0.97 }}
      transition={{
        delay: show ? cardDelay : 0,
        duration: reducedMotion ? 0 : 0.45,
        ease: "easeOut",
      }}
    >
      <DemandeFlipCard
        variant="internal"
        className="h-full min-h-[260px] shadow-none"
        onFlipChange={onFlipChange}
        versoFields={{
          dureeSouhaitee: card.dureeSouhaitee,
          horizonResultat: card.horizonResultat,
          historiqueAgences: card.historiqueAgences,
        }}
        recto={
          <>
            <CardHeader className="gap-2 border-b border-border px-5 py-4 pr-12">
              <div className="flex w-full flex-col items-center gap-3 text-center">
                <div className="flex items-center justify-center gap-2.5">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                      iconBoxClass,
                    )}
                  >
                    <Icon className={cn("size-4", iconClass)} aria-hidden />
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("max-w-full shrink truncate font-medium", badgeClass)}
                  >
                    {card.secteur}
                  </Badge>
                </div>
                <p className="w-full text-center text-xs text-muted-foreground">
                  {card.zone} · {card.taille}
                </p>
                <MaskedContactLine
                  contactEmail={card.contactEmail}
                  contactPhone={card.contactPhone}
                />
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 px-5 py-4">
              <p className="text-base font-semibold leading-snug text-foreground">
                {card.prestation}
              </p>
              <div className="mt-auto border-t border-border pt-3">
                <DemandeMetaRow
                  label="Budget"
                  value={card.budget}
                  variant="internal"
                  valueClassName="font-medium"
                />
                <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground/80">
                  {windowLabel}
                </p>
              </div>
            </CardContent>
          </>
        }
      />
    </motion.div>
  );
}

export function SalesEligiblePanel({
  qualificationValues,
  reglesAccepted,
  developerMode = false,
}: SalesEligiblePanelProps) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<RevealPhase>("loading");
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  const result = useMemo(
    () => scoreAgencyPresets(qualificationValues),
    [qualificationValues],
  );
  const preset = getAgencyPreset(result.id);
  const cards = useMemo(
    () => composeOpportunityCards(qualificationValues, result.id),
    [qualificationValues, result.id],
  );

  useEffect(() => {
    setPhase("loading");
  }, [result.id]);

  useEffect(() => {
    if (phase !== "loading") return undefined;

    const timeout = window.setTimeout(
      () => setPhase(reducedMotion ? "cards" : "logo"),
      REVEAL.LOADING_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [phase, reducedMotion, result.id]);

  useEffect(() => {
    if (phase !== "logo") return undefined;

    const timeout = window.setTimeout(() => setPhase("copy"), REVEAL.LOGO_MS);
    return () => window.clearTimeout(timeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== "copy") return undefined;

    const timeout = window.setTimeout(() => setPhase("cards"), REVEAL.COPY_MS);
    return () => window.clearTimeout(timeout);
  }, [phase]);

  const showLogo = phase !== "loading";
  const showCopy = phase === "copy" || phase === "cards";
  const showCards = phase === "cards";
  const showRulesAlert = showCards && !developerMode && !reglesAccepted;

  if (phase === "loading") {
    return (
      <div
        className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/40"
        role="status"
        aria-live="polite"
      >
        <Spinner className="size-6" />
        <p className="text-sm text-muted-foreground">Analyse de votre profil…</p>
      </div>
    );
  }

  return (
    <div
      className="flex w-full flex-col items-center gap-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-5">
        {showLogo ? (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.6, ease: "easeOut" }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex items-center gap-3">
              <HerculeMark variant="dual" className="size-10 text-foreground" />
              <span className="text-2xl font-semibold tracking-tight text-foreground">
                Hercule
              </span>
            </div>
            <motion.div
              initial={reducedMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                delay: reducedMotion ? 0 : 0.3,
                duration: reducedMotion ? 0 : 0.8,
                ease: "easeInOut",
              }}
              className="h-px w-32 origin-center bg-primary/40"
            />
          </motion.div>
        ) : null}

        {showCopy ? (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.5, ease: "easeOut" }}
            className="max-w-xl space-y-2 text-center"
          >
            <h2 className="text-base font-medium text-foreground">
              {cards.length} opportunité{cards.length > 1 ? "s" : ""} sélectionnée
              {cards.length > 1 ? "s" : ""} pour votre profil {preset.name}
            </h2>
            <p className="text-sm text-muted-foreground">{preset.tagline}</p>
          </motion.div>
        ) : null}
      </div>

      {showRulesAlert ? (
        <InternalStatusAlert
          variant="info"
          title="Règles de traitement"
          message="Avant d'accéder à vos opportunités, confirmez vos règles de traitement."
          className="max-w-xl text-left"
        />
      ) : null}

      <div
        className={cn(
          "mt-8 grid w-full max-w-5xl gap-4 justify-items-center",
          "sm:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {cards.map((card, index) => (
          <OpportunityCard
            key={card.id}
            card={card}
            index={index}
            show={showCards}
            reducedMotion={reducedMotion ?? false}
            isBlurred={flippedIndex !== null && flippedIndex !== index}
            onFlipChange={(flipped) => setFlippedIndex(flipped ? index : null)}
          />
        ))}
      </div>
    </div>
  );
}
