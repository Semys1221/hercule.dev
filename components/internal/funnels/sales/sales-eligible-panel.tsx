"use client";

import { useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
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

const LOADING_MS = 1500;

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
          <p>
            Classé ainsi car : {result.reasons.join(", ")}.
          </p>
        ) : (
          <p>Profil par défaut à partir des réponses actuellement renseignées.</p>
        )}
      </CardContent>
    </Card>
  );
}

function BlurredValue({ value }: { value: string }) {
  return (
    <span
      className="inline-block select-none blur-[4px]"
      aria-hidden
    >
      {value}
    </span>
  );
}

function OpportunityCard({ card }: { card: PresetOpportunityCard }) {
  const windowLabel = formatContractWindow(card);

  return (
    <Card className="h-full gap-0 overflow-hidden py-0 shadow-none">
      <CardHeader className="gap-2 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
            <Package className="size-4 text-muted-foreground" aria-hidden />
          </div>
          <Badge variant="outline" className="font-medium">
            {card.secteur}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {card.zone} · {card.taille}
        </p>
        <p className="text-xs text-muted-foreground">
          <BlurredValue value={card.companyNameBlurred} />
          {" · "}
          <BlurredValue value={card.domainBlurred} />
          <span className="sr-only">Identité entreprise masquée</span>
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 px-5 py-4">
        <p className="text-sm font-medium leading-snug text-foreground">{card.prestation}</p>
        <div className="mt-auto space-y-2 border-t border-border pt-3 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="shrink-0 text-muted-foreground">Budget</span>
            <span className="text-right text-foreground">{card.budget}</span>
          </div>
          <p className="text-xs text-muted-foreground">{windowLabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SalesEligiblePanel({
  qualificationValues,
  reglesAccepted,
  developerMode = false,
}: SalesEligiblePanelProps) {
  const [ready, setReady] = useState(false);
  const result = useMemo(
    () => scoreAgencyPresets(qualificationValues),
    [qualificationValues],
  );
  const cards = getAgencyPreset(result.id).cards;

  useEffect(() => {
    const timeout = window.setTimeout(() => setReady(true), LOADING_MS);
    return () => window.clearTimeout(timeout);
  }, [result.id]);

  if (!ready) {
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
    <div className="space-y-6">
      {!developerMode && !reglesAccepted ? (
        <InternalStatusAlert
          variant="info"
          title="Règles de traitement"
          message="Avant d'accéder à vos opportunités, confirmez vos règles de traitement."
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <OpportunityCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
