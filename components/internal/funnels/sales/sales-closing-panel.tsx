"use client";

import { useCallback, useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  SALES_QUESTIONS,
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
import { SalesEligiblePanel, SalesPresetSummary } from "./sales-eligible-panel";

type SalesClosingPanelProps = {
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

function SalesCallStatusActions({ salesCallId }: { salesCallId: string | null }) {
  const [pending, setPending] = useState<"completed" | "not_paid" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const patchStatus = useCallback(
    async (status: "completed" | "not_paid") => {
      if (!salesCallId) return;
      setPending(status);
      setMessage(null);
      try {
        const response = await fetch(`/api/admin/sales-calls/${salesCallId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const body = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(body.error ?? "Mise à jour impossible");
        }
        setMessage(
          status === "completed"
            ? "Statut completed — séquence upsell lancée."
            : "Statut not_paid — séquence indécis lancée.",
        );
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Erreur");
      } finally {
        setPending(null);
      }
    },
    [salesCallId],
  );

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <p className="text-sm font-medium">Issue de l&apos;appel</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!salesCallId || pending !== null}
          onClick={() => void patchStatus("completed")}
        >
          {pending === "completed" ? "Envoi…" : "Completed — upsell"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!salesCallId || pending !== null}
          onClick={() => void patchStatus("not_paid")}
        >
          {pending === "not_paid" ? "Envoi…" : "not_paid"}
        </Button>
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}

const TREATMENT_RULES = [
  "Réactivité — répondre à toute proposition Hercule sous 24h ouvrées.",
  "Traitement — chaque demande est traitée avec sérieux dans un délai raisonnable.",
  "No-show — signaler tout no-show entreprise sous 48h → remplacement ≤ 14 jours.",
  "Disponibilité — informer Hercule en cas d'indisponibilité avant la date prévue.",
  "Exclusivité — ne pas contacter directement une entreprise transmise hors du cadre Hercule.",
] as const;

const CALENDAR_RULES = [
  "Réponse aux propositions — sous 24h ouvrées.",
  "Indisponibilité — prévenez-nous au minimum 48h à l'avance.",
  "Pas de double-sourcing — une demande Hercule n'est pas soumise à d'autres canaux simultanément.",
] as const;

const DASHBOARD_FEATURES = [
  "Le suivi de vos demandes en cours et leur statut",
  "L'historique de vos matches et résultats",
  "Les informations liées à votre offre et votre facturation",
] as const;

const DASHBOARD_NEXT_STEPS = [
  "Accès onboarding — sous 48h après réception du lien",
  "Activation — premier matching lancé dès l'onboarding complété",
  "Proposition de match — RDV livraison planifié sous 5–10 jours ouvrés",
  "Premier RDV honoré — ≤ 21 jours après activation",
] as const;

const DEV_PREVIEW_DASHBOARD_LINK = buildDashboardUrl("dev-preview");

export function SalesClosingPanel({
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
  const section = getSalesClosingSection(sectionId);
  const qualificationValues = qualificationForm.getValues();
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
    () => scoreAgencyPresets(qualificationValues),
    [qualificationValues],
  );

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

  return (
    <div
      className={
        sectionId === "demandes-eligibles"
          ? "mx-auto max-w-5xl space-y-6 text-left"
          : "mx-auto max-w-3xl space-y-6 text-left"
      }
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{section.title}</h1>
        {section.subtitle ? (
          <p className="mt-2 text-sm text-muted-foreground">{section.subtitle}</p>
        ) : null}
      </div>

      {sectionId === "recap" ? (
        <div className="space-y-6">
          <SalesPresetSummary result={presetResult} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Réponses qualification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {SALES_QUESTIONS.map((question) => (
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
          <CardContent className="space-y-4 pt-6 text-sm">
            <ul className="list-disc space-y-2 pl-5 leading-relaxed">
              {TREATMENT_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
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
          qualificationValues={qualificationValues}
          reglesAccepted={closingValues.reglesAccepted}
          developerMode={developerMode}
        />
      ) : null}

      {sectionId === "calendrier" ? (
        <Card>
          <CardContent className="space-y-4 pt-6 text-sm">
            <p>
              Sur la base de votre capacité déclarée ({qualificationValues.q20} projets / mois
              réservés à Hercule) :
            </p>
            <ul className="list-disc space-y-2 pl-5 leading-relaxed">
              {CALENDAR_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            <p className="text-muted-foreground">
              Ce calendrier est indicatif et s&apos;adapte à la disponibilité des deux parties.
            </p>
            <div className="flex items-start gap-3">
              <Checkbox
                id="calendrierAccepted"
                checked={closingValues.calendrierAccepted}
                onCheckedChange={(checked) => {
                  void persistTieDown({ calendrierAccepted: checked === true });
                }}
                disabled={saving}
              />
              <Label htmlFor="calendrierAccepted" className="leading-relaxed">
                J&apos;ai pris note du calendrier prévisionnel de collaboration.
              </Label>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {sectionId === "envoi-dashboard" ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-3 text-sm">
              <p className="font-medium">Votre dashboard vous donne accès à :</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {DASHBOARD_FEATURES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="font-medium">Prochaines étapes :</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                {DASHBOARD_NEXT_STEPS.map((item) => (
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
                <p className="text-sm text-muted-foreground">Lien dashboard client :</p>
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
                <SalesCallStatusActions salesCallId={salesCallId} />
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
