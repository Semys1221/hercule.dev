"use client";

import { useCallback, useEffect, useState } from "react";

import { DashboardBrandHeader } from "@/components/legacy/dashboard/brand-header";
import { CLIENT_CGV_VERSION } from "@/lib/clients/cgv-onboarding";
import {
  selectSlugState,
  useClientOnboardingStore,
} from "@/lib/clients/onboarding-store";
import type { ClientDashboardData } from "@/lib/clients/types";

import { ClientOnboardingCgv } from "./client-onboarding-cgv";
import { ClientOnboardingRecap } from "./client-onboarding-recap";

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
  const setStep = useClientOnboardingStore((s) => s.setStep);
  const markCgvAccepted = useClientOnboardingStore((s) => s.markCgvAccepted);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureSlug(slug, data.firstName);
  }, [slug, data.firstName, ensureSlug]);

  const local = selectSlugState(bySlug, slug);

  // Server still onboarding: never trust a local welcome/done skip of CGV.
  const step =
    local.step === "recap" || local.step === "cgv" ? local.step : "cgv";

  const handleContinue = useCallback(() => {
    if (!local.firstNameDraft.trim() || !local.videoConferenceDraft) return;
    setStep(slug, "cgv");
  }, [local.firstNameDraft, local.videoConferenceDraft, setStep, slug]);

  const handleAccept = useCallback(async () => {
    const firstName = local.firstNameDraft.trim();
    const videoConference = local.videoConferenceDraft;
    if (!firstName || !videoConference) {
      setError("Indiquez votre prénom et votre outil de visioconférence pour continuer.");
      setStep(slug, "recap");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          videoConference,
          completeOnboarding: true,
          cgvVersion: CLIENT_CGV_VERSION,
        }),
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
    local.videoConferenceDraft,
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
          <ClientOnboardingRecap
            data={data}
            firstName={local.firstNameDraft}
            videoConference={local.videoConferenceDraft}
            onFirstNameChange={(value) => setFirstNameDraft(slug, value)}
            onVideoConferenceChange={(value) => setVideoConferenceDraft(slug, value)}
            onContinue={handleContinue}
            paidConfirmed={paidConfirmed}
          />
        ) : (
          <ClientOnboardingCgv
            saving={saving}
            error={error}
            onAccept={() => void handleAccept()}
          />
        )}
      </main>
    </div>
  );
}
