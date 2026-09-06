"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/types";

import { DashboardBrandHeader, DashboardPageHeader } from "./brand-header";
import { OnboardingFormModal } from "./onboarding-form-modal";

type DashboardStateProps = {
  data: DashboardData;
  onOnboardingComplete?: () => void;
};

function statusLabel(data: DashboardData): string {
  if (data.productStatut === "IN_DELIVERANCE") {
    return "Votre livraison est active";
  }
  if (data.onboardingCompleted) {
    return "Votre première livraison est en préparation";
  }
  return "Livraison en cours de démarrage";
}

function statusDetail(data: DashboardData): string {
  if (data.scheduledAt) {
    return `Rendez-vous confirmé le ${new Date(data.scheduledAt).toLocaleString("fr-FR")}`;
  }
  return "Suivi de votre parcours Hercule";
}

export function DashboardState({ data, onOnboardingComplete }: DashboardStateProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const greeting = data.firstName || "Bonjour";
  const prospectLine = data.company ? `${greeting} · ${data.company}` : greeting;

  return (
    <div className="mx-auto max-w-3xl px-6 pb-20">
      <DashboardBrandHeader />

      <div className="pt-10">
        <DashboardPageHeader
          eyebrow="Suivi de votre livraison"
          title={`Commande #${data.slug.slice(0, 8).toUpperCase()}`}
          subtitle={prospectLine}
        />
      </div>

      {/* Onboarding CTA — shown only when onboarding is not complete */}
      {!data.onboardingCompleted && (
        <Card className="mt-0 border-border">
          <CardHeader className="pb-3">
            <div className="mb-1 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-amber-500/40 text-xs text-amber-400"
              >
                Action requise
              </Badge>
            </div>
            <CardTitle className="text-base font-semibold">
              Complétez votre onboarding
            </CardTitle>
            <CardDescription>
              Renseignez votre profil agence pour activer la recherche de demandes qualifiées.
              Moins de 3 minutes.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button type="button" size="sm" onClick={() => setModalOpen(true)}>
              Compléter mon onboarding
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Timeline — single card, no duplicate badge version */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">{statusLabel(data)}</CardTitle>
          <CardDescription>{statusDetail(data)}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {data.timeline.map((step) => (
              <li key={step.id} className="flex gap-3">
                <span
                  className={`mt-2 size-2 shrink-0 rounded-full ${
                    step.status === "done"
                      ? "bg-emerald-500"
                      : step.status === "active"
                        ? "bg-primary"
                        : "bg-border"
                  }`}
                />
                <div>
                  <p className="font-medium">{step.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {step.meta ||
                      (step.status === "active"
                        ? "En cours"
                        : step.status === "done"
                          ? "Terminé"
                          : "À venir")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <OnboardingFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        slug={data.slug}
        data={data}
        onSuccess={() => {
          onOnboardingComplete?.();
        }}
      />
    </div>
  );
}
