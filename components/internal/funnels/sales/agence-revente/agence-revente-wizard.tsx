"use client";

import { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { buildPipelineIntroScript } from "@/lib/calendly/pipeline-intro-script";
import type { PipelineQualificationInput } from "@/lib/calendly/pipeline-qualification-schema";
import {
  PIPELINE_BUYER_FIT_OPTIONS,
  PIPELINE_CLIENT_RESULTS_ORGANIC_6M,
  PIPELINE_CLIENT_RESULTS_PAID_3M,
  coercePipelineClientCount,
  formatB2bClientCount,
  normalizePipelineQualification,
  rdvPerMonthToCapacityDays,
} from "@/lib/calendly/pipeline-qualification-schema";
import { cn } from "@/lib/utils";

import { AgenceReventeRoiStep } from "./agence-revente-roi-step";

const WIZARD_STEPS = [
  "buyer_fit",
  "services",
  "client_results",
  "strategy",
  "objective",
  "pipeline_feedback",
  "roi_simulator",
  "onboarding_tools",
  "intro_submit",
] as const;

type WizardStepId = (typeof WIZARD_STEPS)[number];

export type AgenceReventeWizardValues = Omit<
  PipelineQualificationInput,
  "slug" | "metrics_snapshot" | "roi_matches_objective"
> & {
  roi_matches_objective?: PipelineQualificationInput["roi_matches_objective"];
};

type AgenceReventeWizardProps = {
  initialEmail: string;
  initialCompanyName?: string;
  initialServices?: string;
  developerModeEnabled: boolean;
  saving: boolean;
  error: string | null;
  onSubmit: (values: AgenceReventeWizardValues) => void;
  onDevSkip?: () => void;
};

type LegacyClientResultsValues = AgenceReventeWizardValues & {
  client_results_organic_12m?: unknown;
};

function resolveClientResultsCounts(values: LegacyClientResultsValues) {
  return {
    paid: coercePipelineClientCount(
      values.client_results_paid_3m,
      PIPELINE_CLIENT_RESULTS_PAID_3M,
    ),
    organic: coercePipelineClientCount(
      values.client_results_organic_6m ?? values.client_results_organic_12m,
      PIPELINE_CLIENT_RESULTS_ORGANIC_6M,
    ),
  };
}

const defaultValues = (
  email: string,
  companyName = "",
  services = "",
): AgenceReventeWizardValues => {
  const base = normalizePipelineQualification({
    email,
    company_name: companyName,
    buyer_fit_long_term_growth: false,
    buyer_fit_loves_client_exchange: false,
    buyer_fit_monthly_results: false,
    services,
    client_results_paid_3m: PIPELINE_CLIENT_RESULTS_PAID_3M.default,
    client_results_organic_6m: PIPELINE_CLIENT_RESULTS_ORGANIC_6M.default,
    has_strategy: false,
    strategy_detail: "",
    objective: "",
    pipeline_liked: "",
    engagement: "monthly_growth",
    roi_call_model: "1_call",
    roi_rdv_per_month: 20,
    roi_meeting_duration: "30min",
    roi_personality_artisan: false,
    roi_personality_agence_tech: false,
    roi_personality_finance: true,
    roi_closing_rate: 20,
    roi_basket_eur: 1500,
    roi_matches_objective: undefined,
    high_closing_service: "",
    high_closing_timeline: undefined,
    calendly_login: "",
    zoom_login: "",
    capacity_days_per_month: 5,
    closing_rate_min: 20,
  });

  return {
    ...(base as AgenceReventeWizardValues),
    capacity_days_per_month: rdvPerMonthToCapacityDays(base.roi_rdv_per_month),
    closing_rate_min: base.roi_closing_rate,
    roi_matches_objective: undefined,
  };
};

export function AgenceReventeWizard({
  initialEmail,
  initialCompanyName = "",
  initialServices = "",
  developerModeEnabled,
  saving,
  error,
  onSubmit,
  onDevSkip,
}: AgenceReventeWizardProps) {
  const [stepId, setStepId] = useState<WizardStepId>("buyer_fit");
  const [values, setValues] = useState<AgenceReventeWizardValues>(() =>
    defaultValues(initialEmail, initialCompanyName, initialServices),
  );
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const prefilledServices = initialServices.trim();
    const prefilledCompany = initialCompanyName.trim();
    setValues((current) => {
      const counts = resolveClientResultsCounts(current);
      return normalizePipelineQualification({
        ...current,
        services: current.services.trim() || prefilledServices,
        company_name: current.company_name.trim() || prefilledCompany,
        client_results_paid_3m: counts.paid,
        client_results_organic_6m: counts.organic,
      });
    });
  }, [initialCompanyName, initialServices]);

  const clientResultsCounts = useMemo(
    () => resolveClientResultsCounts(values),
    [values],
  );

  const steps = WIZARD_STEPS;
  const stepIndex = steps.indexOf(stepId);
  const progress = steps.length > 1 ? ((stepIndex + 1) / steps.length) * 100 : 100;

  const introScript = useMemo(
    () =>
      values.company_name && values.engagement
        ? buildPipelineIntroScript({
            company_name: values.company_name,
            engagement: values.engagement,
          })
        : "",
    [values.company_name, values.engagement],
  );

  function patch(patch: Partial<AgenceReventeWizardValues>) {
    setValues((current) => normalizePipelineQualification({ ...current, ...patch }));
  }

  function validateCurrentStep(): string | null {
    switch (stepId) {
      case "buyer_fit":
        if (
          !values.buyer_fit_long_term_growth ||
          !values.buyer_fit_loves_client_exchange ||
          !values.buyer_fit_monthly_results
        ) {
          return "Cochez les trois critères acheteur pour continuer.";
        }
        if (!values.company_name.trim()) {
          return "Nom de société manquant sur la fiche CRM.";
        }
        if (!values.email.trim()) {
          return "Email manquant sur la fiche CRM.";
        }
        return null;
      case "services":
        return values.services.trim() ? null : "Décrivez vos services.";
      case "client_results":
        return null;
      case "strategy":
        if (values.has_strategy && !values.strategy_detail?.trim()) {
          return "Décrivez votre stratégie.";
        }
        return null;
      case "objective":
        return values.objective.trim() ? null : "Précisez votre objectif.";
      case "pipeline_feedback":
        return values.pipeline_liked.trim()
          ? null
          : "Précisez ce qui vous a plu dans le pipeline.";
      case "roi_simulator":
        if (!values.roi_matches_objective) {
          return "Indiquez si le ROI correspond à vos objectifs.";
        }
        if (values.roi_closing_rate > 20) {
          if (!values.high_closing_service?.trim()) {
            return "Précisez le service visé.";
          }
          if (!values.high_closing_timeline) {
            return "Choisissez un délai.";
          }
        }
        return null;
      default:
        return null;
    }
  }

  function goNext(skipValidation = false) {
    if (!skipValidation) {
      const validationError = validateCurrentStep();
      if (validationError) {
        setLocalError(validationError);
        return;
      }
    }
    setLocalError(null);
    const next = steps[stepIndex + 1];
    if (next) {
      setStepId(next);
      return;
    }
    onSubmit(values);
  }

  function goPrev() {
    setLocalError(null);
    const prev = steps[stepIndex - 1];
    if (prev) setStepId(prev);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 md:p-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Qualification Acheteur</span>
          <span>Étape {stepIndex + 1} / {steps.length}</span>
        </div>
        <Progress value={progress} />
      </div>

      {(localError || error) && (
        <Alert variant="destructive">
          <AlertDescription>{localError ?? error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {stepId === "buyer_fit" && "Acheteur"}
            {stepId === "services" && "Quels sont vos services ?"}
            {stepId === "client_results" && "Résultats possibles pour vos clients"}
            {stepId === "strategy" && "Avez-vous déjà une stratégie en tête ?"}
            {stepId === "objective" && "Quelle serait votre objectif ?"}
            {stepId === "pipeline_feedback" && "Retour sur le pipeline"}
            {stepId === "roi_simulator" && "Simulateur ROI pipeline"}
            {stepId === "onboarding_tools" && "Calendly & Zoom Pro"}
            {stepId === "intro_submit" && "Script d'introduction"}
          </CardTitle>
          {stepId === "roi_simulator" ? (
            <CardDescription>
              Projetez votre retour sur investissement à partir de 20 rendez-vous
              mensuels.
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {stepId === "buyer_fit" ? (
            <>
              <CardDescription>
                Cochez les éléments que vous validez chez cet acheteur avant de
                poursuivre la qualification Acheteur.
              </CardDescription>
              <div className="space-y-2">
                {PIPELINE_BUYER_FIT_OPTIONS.map((option) => (
                  <Field
                    key={option.field}
                    orientation="horizontal"
                    className="items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <Checkbox
                      id={option.field}
                      checked={values[option.field]}
                      onCheckedChange={(checked) =>
                        patch({ [option.field]: checked === true })
                      }
                    />
                    <FieldLabel
                      htmlFor={option.field}
                      className="font-normal leading-snug"
                    >
                      {option.label}
                    </FieldLabel>
                  </Field>
                ))}
              </div>
            </>
          ) : null}

          {stepId === "services" ? (
            <Textarea
              rows={5}
              value={values.services}
              onChange={(event) => patch({ services: event.target.value })}
              placeholder="SEO, paid ads, refonte site, branding…"
            />
          ) : null}

          {stepId === "client_results" ? (
            <>
              <Alert>
                <AlertDescription>
                  Comptables et conseillers financiers : croissance stable au
                  bouche-à-oreille, volonté de cibler le B2B (plus rentable).
                </AlertDescription>
              </Alert>
              <div className="space-y-3">
                <Label id="client-results-paid-label">
                  Paid ads — {formatB2bClientCount(clientResultsCounts.paid)}{" "}
                  <span className="text-muted-foreground">(3 mois)</span>
                </Label>
                <Slider
                  key="client-results-paid"
                  aria-labelledby="client-results-paid-label"
                  min={PIPELINE_CLIENT_RESULTS_PAID_3M.min}
                  max={PIPELINE_CLIENT_RESULTS_PAID_3M.max}
                  step={1}
                  value={[clientResultsCounts.paid]}
                  onValueChange={(next) =>
                    patch({
                      client_results_paid_3m: coercePipelineClientCount(
                        next[0],
                        PIPELINE_CLIENT_RESULTS_PAID_3M,
                      ),
                    })
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{PIPELINE_CLIENT_RESULTS_PAID_3M.min} client</span>
                  <span>{PIPELINE_CLIENT_RESULTS_PAID_3M.max} clients</span>
                </div>
              </div>
              <div className="space-y-3">
                <Label id="client-results-organic-label">
                  Organique — {formatB2bClientCount(clientResultsCounts.organic)}{" "}
                  <span className="text-muted-foreground">(6 mois)</span>
                </Label>
                <Slider
                  key="client-results-organic"
                  aria-labelledby="client-results-organic-label"
                  min={PIPELINE_CLIENT_RESULTS_ORGANIC_6M.min}
                  max={PIPELINE_CLIENT_RESULTS_ORGANIC_6M.max}
                  step={1}
                  value={[clientResultsCounts.organic]}
                  onValueChange={(next) =>
                    patch({
                      client_results_organic_6m: coercePipelineClientCount(
                        next[0],
                        PIPELINE_CLIENT_RESULTS_ORGANIC_6M,
                      ),
                    })
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{PIPELINE_CLIENT_RESULTS_ORGANIC_6M.min} client</span>
                  <span>{PIPELINE_CLIENT_RESULTS_ORGANIC_6M.max} clients</span>
                </div>
              </div>
            </>
          ) : null}

          {stepId === "strategy" ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={values.has_strategy ? "default" : "outline"}
                  onClick={() => patch({ has_strategy: true })}
                >
                  Oui
                </Button>
                <Button
                  type="button"
                  variant={!values.has_strategy ? "default" : "outline"}
                  onClick={() => patch({ has_strategy: false, strategy_detail: "" })}
                >
                  Non
                </Button>
              </div>
              {values.has_strategy ? (
                <Textarea
                  rows={4}
                  value={values.strategy_detail}
                  onChange={(event) => patch({ strategy_detail: event.target.value })}
                />
              ) : null}
            </>
          ) : null}

          {stepId === "objective" ? (
            <Textarea
              rows={5}
              value={values.objective}
              onChange={(event) => patch({ objective: event.target.value })}
            />
          ) : null}

          {stepId === "pipeline_feedback" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="pipeline-liked">
                  Qu&apos;est-ce qui vous a plu dans le pipeline présenté ?
                </Label>
                <Textarea
                  id="pipeline-liked"
                  rows={4}
                  value={values.pipeline_liked}
                  onChange={(event) => patch({ pipeline_liked: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Ce que vous recherchez avec ce pipeline, ce serait combler des
                  besoins ponctuellement ou bien l&apos;intégrer dans votre
                  croissance d&apos;entreprise ?
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      value: "one_shot" as const,
                      label: "Besoins ponctuels",
                    },
                    {
                      value: "monthly_growth" as const,
                      label: "Croissance d'entreprise",
                    },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={
                        values.engagement === option.value ? "default" : "outline"
                      }
                      onClick={() => patch({ engagement: option.value })}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {stepId === "roi_simulator" ? (
            <AgenceReventeRoiStep values={values} onPatch={patch} />
          ) : null}

          {stepId === "onboarding_tools" ? (
            <>
              <Alert>
                <AlertDescription>
                  Calendly et Zoom Pro sont fournis par Hercule. À l&apos;onboarding,
                  vous devrez renseigner vos identifiants.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label>Identifiant Calendly (optionnel)</Label>
                <Input
                  value={values.calendly_login}
                  onChange={(event) => patch({ calendly_login: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Identifiant Zoom Pro (optionnel)</Label>
                <Input
                  value={values.zoom_login}
                  onChange={(event) => patch({ zoom_login: event.target.value })}
                />
              </div>
            </>
          ) : null}

          {stepId === "intro_submit" ? (
            <p className={cn("rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed")}>
              {introScript}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={goPrev} disabled={stepIndex === 0}>
          Retour
        </Button>
        <div className="flex flex-wrap gap-2">
          {developerModeEnabled && onDevSkip ? (
            <Button type="button" variant="secondary" onClick={onDevSkip}>
              Passer au pipeline
            </Button>
          ) : null}
          {developerModeEnabled ? (
            <Button type="button" variant="ghost" onClick={() => goNext(true)}>
              Étape suivante (dev)
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => goNext(false)}
            disabled={saving}
          >
            {stepId === "intro_submit" ? "Accéder au pipeline" : "Continuer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
