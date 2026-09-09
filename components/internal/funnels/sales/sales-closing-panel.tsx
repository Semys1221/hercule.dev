"use client";

import { useCallback, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarOff,
  ClipboardCheck,
  Clock,
  UserX,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Audience } from "@/lib/admin/navigation";
import {
  getSalesQuestions,
  formatSliderLabel,
  type SalesQuestion,
} from "@/components/internal/funnels/sales/sales-questions";
import { scoreAgencyPresets } from "@/lib/admin/funnels/sales-preset-scoring";
import { SESSION_DEVELOPER_MODE_FAKE_LINK } from "@/lib/admin/funnels/ui-copy";
import { SALES_SKIP_VALUE, type SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import { buildDashboardUrl, dashboardLinkFor } from "@/lib/link-tracking/urls";

import {
  getSalesClosingSection,
  isSalesClosingReadyForDashboardLink,
  type SalesClosingSectionId,
  type SalesClosingValues,
} from "./sales-closing-sections";
import { SalesCalendrierPanel } from "./sales-calendrier-panel";
import { SalesComptablePricingPanel } from "./sales-comptable-pricing-panel";
import { SalesEligiblePanel, SalesPresetSummary } from "./sales-eligible-panel";

type SalesClosingPanelProps = {
  audience: Audience;
  sectionId: SalesClosingSectionId;
  qualificationForm: UseFormReturn<SalesQualificationValues>;
  closingValues: SalesClosingValues;
  onClosingChange: (values: Partial<SalesClosingValues>) => void;
  selectedLead: LinkTrackingLead | null;
  salesCallId: string | null;
  developerMode?: boolean;
  onRefreshLead: () => Promise<void>;
  onPersistClosing: (closing: SalesClosingValues) => Promise<void>;
};

function formatQuestionAnswer(question: SalesQuestion, values: SalesQualificationValues): string {
  const raw = values[question.id as keyof SalesQualificationValues];

  if (question.type === "multi" && Array.isArray(raw)) {
    return (
      raw
        .map((id) => question.options.find((option) => option.id === id)?.label ?? id)
        .join(", ") || "—"
    );
  }

  if (question.type === "single" && typeof raw === "string") {
    return (question.options.find((option) => option.id === raw)?.label ?? raw) || "—";
  }

  if (question.type === "slider") {
    if (raw === null) {
      return question.optOutLabel ?? "—";
    }
    if (typeof raw === "number") {
      return formatSliderLabel(raw, question.slider.unit);
    }
  }

  if (question.type === "slider_matrix" && typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const matrix = raw as SalesQualificationValues["q14"];
    return question.subQuestions
      .map((sub) => `${sub.label} : ${formatSliderLabel(matrix[sub.id], question.slider.unit)}`)
      .join(" · ");
  }

  if (question.type === "conditional_slider") {
    if (raw === SALES_SKIP_VALUE) {
      return question.skipLabel;
    }
    if (typeof raw === "number") {
      return formatSliderLabel(raw, question.slider.unit);
    }
  }

  if (typeof raw === "boolean") {
    return raw ? "Oui" : "Non";
  }

  return raw === null || raw === undefined || raw === "" ? "—" : String(raw);
}

type TreatmentRule = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const AGENCE_TREATMENT_RULES: TreatmentRule[] = [
  {
    id: "reactivite",
    title: "Réactivité",
    description: "Répondre à toute proposition Hercule sous 24h ouvrées.",
    icon: Clock,
  },
  {
    id: "traitement",
    title: "Traitement",
    description: "Chaque demande est traitée avec sérieux dans un délai raisonnable.",
    icon: ClipboardCheck,
  },
  {
    id: "no-show",
    title: "No-show",
    description:
      "Signaler tout no-show entreprise sous 48h → remplacement ≤ 14 jours.",
    icon: UserX,
  },
  {
    id: "disponibilite",
    title: "Disponibilité",
    description: "Informer Hercule en cas d'indisponibilité avant la date prévue.",
    icon: CalendarOff,
  },
];

const COMPTABLE_TREATMENT_RULES: TreatmentRule[] = [
  {
    id: "reactivite",
    title: "Réactivité",
    description: "Répondre à toute mission TPE proposée sous 24h ouvrées.",
    icon: Clock,
  },
  {
    id: "traitement",
    title: "Traitement",
    description: "Chaque mission TPE est traitée avec sérieux dans un délai raisonnable.",
    icon: ClipboardCheck,
  },
  {
    id: "no-show",
    title: "No-show",
    description:
      "Signaler tout no-show dirigeant TPE sous 48h → remplacement ≤ 14 jours.",
    icon: UserX,
  },
  {
    id: "disponibilite",
    title: "Disponibilité",
    description: "Informer Hercule en cas d'indisponibilité avant la date prévue.",
    icon: CalendarOff,
  },
];

function getTreatmentRules(audience: Audience): TreatmentRule[] {
  return audience === "comptable" ? COMPTABLE_TREATMENT_RULES : AGENCE_TREATMENT_RULES;
}

const AGENCE_DASHBOARD_FEATURES = [
  "Le suivi de vos demandes en cours et leur statut",
  "L'historique de vos matches et résultats",
  "Les informations liées à votre offre et votre facturation",
] as const;

const COMPTABLE_DASHBOARD_FEATURES = [
  "Le suivi de vos missions TPE en cours et leur statut",
  "L'historique de vos mises en relation et résultats",
  "Les informations liées à votre offre et votre facturation",
] as const;

const AGENCE_DASHBOARD_NEXT_STEPS = [
  "Accès onboarding — sous 48h après réception du lien",
  "Activation — premier matching lancé dès l'onboarding complété",
  "Proposition de contrat — mise en relation planifiée sous 5–10 jours ouvrés",
  "Premier contrat livré — ≤ 21 jours après activation",
] as const;

const COMPTABLE_DASHBOARD_NEXT_STEPS = [
  "Accès onboarding — sous 48h après réception du lien",
  "Activation — première mission TPE lancée dès l'onboarding complété",
  "Proposition de mission — RDV dirigeant planifié sous 5–10 jours ouvrés",
  "Premier RDV honoré — ≤ 21 jours après activation",
] as const;

function getDashboardFeatures(audience: Audience): readonly string[] {
  return audience === "comptable" ? COMPTABLE_DASHBOARD_FEATURES : AGENCE_DASHBOARD_FEATURES;
}

function getDashboardNextSteps(audience: Audience): readonly string[] {
  return audience === "comptable" ? COMPTABLE_DASHBOARD_NEXT_STEPS : AGENCE_DASHBOARD_NEXT_STEPS;
}

const DEV_PREVIEW_DASHBOARD_LINK = buildDashboardUrl("dev-preview");

export function SalesClosingPanel({
  audience,
  sectionId,
  qualificationForm,
  closingValues,
  onClosingChange,
  selectedLead,
  salesCallId,
  developerMode = false,
  onRefreshLead,
  onPersistClosing,
}: SalesClosingPanelProps) {
  const section = getSalesClosingSection(sectionId, audience);
  const qualificationValues = qualificationForm.getValues();
  const salesQuestions = useMemo(() => getSalesQuestions(audience), [audience]);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const leadDashboardLink = useMemo(
    () => (selectedLead ? dashboardLinkFor(selectedLead) : null),
    [selectedLead],
  );
  const dashboardLink = useMemo(() => {
    if (leadDashboardLink) return leadDashboardLink;
    if (developerMode) return DEV_PREVIEW_DASHBOARD_LINK;
    return null;
  }, [developerMode, leadDashboardLink]);

  const showDashboardLinkBlock =
    Boolean(dashboardLink) &&
    (developerMode || isSalesClosingReadyForDashboardLink(closingValues));
  const usingFakeDashboardLink = developerMode && !leadDashboardLink;

  const presetResult = useMemo(
    () => scoreAgencyPresets(qualificationValues, audience),
    [audience, qualificationValues],
  );
  const treatmentRules = useMemo(() => getTreatmentRules(audience), [audience]);
  const dashboardFeatures = useMemo(() => getDashboardFeatures(audience), [audience]);
  const dashboardNextSteps = useMemo(() => getDashboardNextSteps(audience), [audience]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefreshLead();
    } finally {
      setRefreshing(false);
    }
  }, [onRefreshLead]);

  const handleCopyDashboard = useCallback(async () => {
    if (!dashboardLink) return;
    await navigator.clipboard.writeText(dashboardLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [dashboardLink]);

  const persistTieDown = useCallback(
    async (patch: Partial<SalesClosingValues>) => {
      const next = { ...closingValues, ...patch };
      onClosingChange(patch);
      if (!salesCallId) return;
      setSaving(true);
      try {
        await onPersistClosing(next);
      } finally {
        setSaving(false);
      }
    },
    [closingValues, onClosingChange, onPersistClosing, salesCallId],
  );

  if (!section) {
    return null;
  }

  const isEligibleSection = sectionId === "demandes-eligibles";

  return (
    <div
      className={
        isEligibleSection
          ? "mx-auto max-w-5xl space-y-6 text-center"
          : "mx-auto max-w-3xl space-y-6 text-left"
      }
    >
      {!isEligibleSection ? (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{section.title}</h1>
          {section.subtitle ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{section.subtitle}</p>
          ) : null}
        </div>
      ) : null}

      {sectionId === "recap" ? (
        <div className="space-y-6">
          <SalesPresetSummary audience={audience} result={presetResult} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Réponses qualification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {salesQuestions.map((question) => (
                <div key={question.id} className="grid gap-1 border-b border-border pb-3 last:border-0">
                  <p className="font-medium">{question.prompt}</p>
                  <p className="text-muted-foreground">
                    {formatQuestionAnswer(question, qualificationValues)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {sectionId === "regles-traitement" ? (
        <Card>
          <CardContent className="space-y-5 pt-6 text-sm">
            <ItemGroup className="gap-3">
              {treatmentRules.map((rule) => {
                const Icon = rule.icon;
                return (
                  <Item key={rule.id} variant="outline" size="default">
                    <ItemMedia variant="icon">
                      <Icon aria-hidden />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{rule.title}</ItemTitle>
                      <ItemDescription>{rule.description}</ItemDescription>
                    </ItemContent>
                  </Item>
                );
              })}
            </ItemGroup>
            <Separator />
            <div className="flex items-start gap-3">
              <Checkbox
                id="reglesAccepted"
                checked={closingValues.reglesAccepted}
                onCheckedChange={(checked) => {
                  void persistTieDown({ reglesAccepted: checked === true });
                }}
                disabled={saving}
              />
              <Label htmlFor="reglesAccepted" className="leading-relaxed">
                J&apos;ai pris connaissance des règles de traitement Hercule et m&apos;engage à les
                respecter.
              </Label>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {sectionId === "demandes-eligibles" ? (
        <SalesEligiblePanel
          audience={audience}
          qualificationValues={qualificationValues}
          reglesAccepted={closingValues.reglesAccepted}
          developerMode={developerMode}
        />
      ) : null}

      {sectionId === "calendrier" ? (
        <SalesCalendrierPanel
          audience={audience}
          qualificationValues={qualificationValues}
          closingValues={closingValues}
          saving={saving}
          persistTieDown={persistTieDown}
        />
      ) : null}

      {sectionId === "activation" && audience === "comptable" ? (
        <SalesComptablePricingPanel
          slug={selectedLead?.slug ?? null}
          developerMode={developerMode}
          closingValues={closingValues}
        />
      ) : null}

      {sectionId === "envoi-dashboard" ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-3 text-sm">
              <p className="font-medium">Votre dashboard vous donne accès à :</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {dashboardFeatures.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="font-medium">Prochaines étapes :</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                {dashboardNextSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>

            {!developerMode && !isSalesClosingReadyForDashboardLink(closingValues) ? (
              <InternalStatusAlert
                variant="error"
                message="Validez les tie-downs « règles de traitement » et « calendrier » avant d'envoyer le lien."
              />
            ) : null}

            {!developerMode && !selectedLead ? (
              <InternalStatusAlert
                variant="error"
                message="Aucun lead associé — sélectionnez un rendez-vous avec fiche CRM."
              />
            ) : null}

            {usingFakeDashboardLink ? (
              <InternalStatusAlert variant="info" message={SESSION_DEVELOPER_MODE_FAKE_LINK} />
            ) : null}

            {showDashboardLinkBlock ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {audience === "comptable"
                    ? "Lien dashboard cabinet :"
                    : "Lien dashboard client :"}
                </p>
                <code className="block break-all rounded-md border border-border bg-muted/30 p-3 text-sm">
                  {dashboardLink}
                </code>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={handleCopyDashboard}>
                    {copied ? "Copié" : "Copier le lien"}
                  </Button>
                  {!usingFakeDashboardLink ? (
                    <Button type="button" variant="outline" onClick={handleRefresh} disabled={refreshing}>
                      {refreshing ? "Rafraîchissement…" : "Rafraîchir le lien"}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <InternalStatusAlert
                  variant="error"
                  message="Le lien dashboard n'est pas encore disponible. Il est généré au webhook Calendly MEETING_BOOKED."
                />
                <Button type="button" variant="outline" onClick={handleRefresh} disabled={refreshing}>
                  {refreshing ? "Rafraîchissement…" : "Rafraîchir le lead"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
