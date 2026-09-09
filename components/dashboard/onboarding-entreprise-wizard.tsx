"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/types";

import { DashboardBrandHeader, DashboardPageHeader } from "./brand-header";
import { StepFaqTieDown } from "./steps/step-faq-tie-down";

type OnboardingEntrepriseWizardProps = {
  data: DashboardData;
  onRefresh: () => void;
};

export function OnboardingEntrepriseWizard({
  data,
  onRefresh,
}: OnboardingEntrepriseWizardProps) {
  const [tieDownAccepted, setTieDownAccepted] = useState(data.tieDownAccepted);
  const [completed, setCompleted] = useState(data.tieDownAccepted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const greeting = data.firstName || "Bonjour";
  const prospectLine = data.company ? `${greeting} · ${data.company}` : greeting;

  const persistTieDown = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/${encodeURIComponent(data.slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tieDownAccepted: true }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Enregistrement impossible");
      }
      setCompleted(true);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setLoading(false);
    }
  }, [data.slug, onRefresh]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <DashboardBrandHeader />

      <main className="mx-auto max-w-3xl px-6 pt-10">
        <DashboardPageHeader
          eyebrow="Votre recherche d'agence"
          title={`Suivi ${data.slug}`}
          subtitle={prospectLine}
        />

        <div className="mt-8">
          {completed ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recherche confirmée</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Merci. Hercule poursuit la qualification de votre besoin et vous contactera
                  par email dès qu&apos;une agence compatible vous sera proposée.
                </p>
                <p>
                  Une question ? Écrivez-nous à{" "}
                  <a
                    href="mailto:contact@hercule.dev"
                    className="text-foreground underline underline-offset-2 hover:no-underline"
                  >
                    contact@hercule.dev
                  </a>
                  .
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-xl border border-border bg-card min-h-[360px] p-6">
                <StepFaqTieDown
                  audience="entreprise"
                  tieDownId="tie-down-entreprise"
                  tieDownAccepted={tieDownAccepted}
                  onTieDownChange={setTieDownAccepted}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => void persistTieDown()}
                  disabled={!tieDownAccepted || loading}
                >
                  {loading ? "Enregistrement…" : "Poursuivre ma recherche"}
                </Button>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
