"use client";

import { useCallback, useEffect, useState } from "react";

import { DashboardBrandHeader } from "@/components/legacy/dashboard/brand-header";
import { CLIENT_CGV_VERSION, CLIENT_CGV_FREE_TRIAL_VERSION } from "@/lib/clients/cgv-onboarding";
import { isCalendlySchedulingUrl } from "@/lib/clients/dec-free-trial";
import {
  selectSlugState,
  useClientOnboardingStore,
} from "@/lib/clients/onboarding-store";
import type { ClientDashboardData } from "@/lib/clients/types";

import { ClientOnboardingCgv } from "./client-onboarding-cgv";
import { ClientOnboardingRecap } from "./client-onboarding-recap";
import { ClientOnboardingRecapFreeTrial } from "./client-onboarding-recap-free-trial";

type ClientOnboardingTunnelProps = {
  data: ClientDashboardData;
  paidConfirmed?: boolean;
  onCompleted: () => void;
};

export function ClientOnboardingTunnel({
  data,
  paidConfirmed,
  onCompleted,
}: ClientOnboardingTunnelProps) {
  const slug = data.slug;
  const hydrated = useClientOnboardingStore((s) => s.hydrated);
  const bySlug = useClientOnboardingStore((s) => s.bySlug);
  const ensureSlug = useClientOnboardingStore((s) => s.ensureSlug);
  const setFirstNameDraft = useClientOnboardingStore((s) => s.setFirstNameDraft);
  const setVideoConferenceDraft = useClientOnboardingStore(
    (s) => s.setVideoConferenceDraft,
  );
  const setUnavailabilityDraft = useClientOnboardingStore(
    (s) => s.setUnavailabilityDraft,
  );
  const setStartNowDraft = useClientOnboardingStore((s) => s.setStartNowDraft);
  const setCalendlyUrlDraft = useClientOnboardingStore((s) => s.setCalendlyUrlDraft);
  const setStep = useClientOnboardingStore((s) => s.setStep);
  const markCgvAccepted = useClientOnboardingStore((s) => s.markCgvAccepted);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureSlug(slug, data.firstName);
  }, [slug, data.firstName, ensureSlug]);

  const local = selectSlugState(bySlug, slug);
  const freeTrial = data.onboardingVariant === "dec_free_trial";

  // Server still onboarding: never trust a local welcome/done skip of CGV.
  const readyForCgv = freeTrial
    ? local.firstNameDraft.trim().length > 0 &&
      isCalendlySchedulingUrl(local.calendlyUrlDraft) &&
      local.unavailabilityDraft.trim().length > 0
    : local.startNowDraft !== null &&
      local.firstNameDraft.trim().length > 0 &&
      local.videoConferenceDraft !== null &&
      local.unavailabilityDraft.trim().length > 0;
  const step = readyForCgv && local.step !== "recap" ? "cgv" : "recap";

  const handleContinue = useCallback(() => {
    if (!readyForCgv) return;
    setStep(slug, "cgv");
  }, [readyForCgv, setStep, slug]);

  const handleAccept = useCallback(async () => {
    const firstName = local.firstNameDraft.trim();
    const videoConference = local.videoConferenceDraft;
    const unavailability = local.unavailabilityDraft.trim();
    const calendlyUrl = local.calendlyUrlDraft.trim();
    if (freeTrial) {
      if (!firstName || !isCalendlySchedulingUrl(calendlyUrl) || !unavailability) {
        setError("Indiquez votre prénom, votre lien Calendly et vos indisponibilités.");
        setStep(slug, "recap");
        return;
      }
    } else if (!firstName || !videoConference || !unavailability || local.startNowDraft === null) {
      setError("Complétez le formulaire, y compris la rétractation, avant les conditions.");
      setStep(slug, "recap");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          freeTrial
            ? {
                firstName,
                unavailability,
                calendlySchedulingUrl: calendlyUrl,
                completeOnboarding: true,
                cgvVersion: CLIENT_CGV_FREE_TRIAL_VERSION,
              }
            : {
                firstName,
                videoConference,
                unavailability,
                completeOnboarding: true,
                cgvVersion: CLIENT_CGV_VERSION,
                waiveRetraction: local.startNowDraft,
              },
        ),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Enregistrement impossible");
      }
      markCgvAccepted(slug);
      onCompleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }, [
    local.firstNameDraft,
    local.startNowDraft,
    local.unavailabilityDraft,
    local.calendlyUrlDraft,
    local.videoConferenceDraft,
    freeTrial,
    markCgvAccepted,
    onCompleted,
    setStep,
    slug,
  ]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <DashboardBrandHeader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardBrandHeader />
      <main className="mx-auto flex max-w-2xl flex-col px-6 py-12">
        {step === "recap" ? (
          freeTrial ? (
            <ClientOnboardingRecapFreeTrial
              data={data}
              firstName={local.firstNameDraft}
              calendlyUrl={local.calendlyUrlDraft}
              unavailability={local.unavailabilityDraft}
              onFirstNameChange={(value) => setFirstNameDraft(slug, value)}
              onCalendlyUrlChange={(value) => setCalendlyUrlDraft(slug, value)}
              onUnavailabilityChange={(value) => setUnavailabilityDraft(slug, value)}
              onContinue={handleContinue}
              paidConfirmed={paidConfirmed}
            />
          ) : (
            <ClientOnboardingRecap
              data={data}
              firstName={local.firstNameDraft}
              videoConference={local.videoConferenceDraft}
              unavailability={local.unavailabilityDraft}
              startNow={local.startNowDraft}
              onFirstNameChange={(value) => setFirstNameDraft(slug, value)}
              onVideoConferenceChange={(value) => setVideoConferenceDraft(slug, value)}
              onUnavailabilityChange={(value) => setUnavailabilityDraft(slug, value)}
              onStartNowChange={(value) => setStartNowDraft(slug, value)}
              onContinue={handleContinue}
              paidConfirmed={paidConfirmed}
            />
          )
        ) : (
          <ClientOnboardingCgv
            data={data}
            startNow={local.startNowDraft === true}
            saving={saving}
            error={error}
            onAccept={() => void handleAccept()}
            variant={data.onboardingVariant}
          />
        )}
      </main>
    </div>
  );
}
