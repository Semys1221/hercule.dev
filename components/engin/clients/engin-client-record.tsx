"use client";

import Link from "next/link";
import * as React from "react";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import type { CalendlySeatOnboardingRow } from "@/lib/(resend)/calendly-seat/client-store";
import {
  renewalAdminDetail,
  renewalAdminLabel,
} from "@/lib/clients/monthly-renewal-announcement";
import { conferenceOfferLabel } from "@/lib/commercial/conference-pricing";
import type { CreditField, EnginClientRow, OnboardingStepStatus } from "@/lib/clients/engin-types";
import type { OpsControl } from "@/lib/clients/engin-ops-controls";
import type { ClientOnboardingAnswers } from "@/lib/clients/onboarding-answers";
import { ELIGIBILITY_LABELS } from "@/lib/clients/round-robin";
import type { ClientRow } from "@/lib/clients/types";

import { EnginClientDeleteCard } from "./engin-client-delete-card";
import { EnginClientTasks } from "./engin-client-tasks";
import { EnginConfirmCalendlyCard } from "./engin-confirm-calendly-card";
import { EnginConnectionsCard } from "./engin-connections-card";
import { EnginCreditsDialog } from "./engin-credits-dialog";
import { EnginOnboardingAnswersCard } from "./engin-onboarding-answers-card";
import { EnginOnboardingStepsList } from "./engin-onboarding-steps-list";

type DetailPayload = {
  client: EnginClientRow;
  answers: ClientOnboardingAnswers;
  onboardingSteps: OnboardingStepStatus[];
  calendlySeat: CalendlySeatOnboardingRow | null;
  controls: OpsControl[];
};

type EnginClientRecordProps = {
  clientId: string;
};

export function EnginClientRecord({ clientId }: EnginClientRecordProps) {
  const [payload, setPayload] = React.useState<DetailPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState("resume");
  const [creditsTarget, setCreditsTarget] = React.useState<{
    client: ClientRow;
    field: CreditField;
  } | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/engin/clients/${encodeURIComponent(clientId)}`);
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Client introuvable");
      }
      const body = (await response.json()) as DetailPayload;
      setPayload(body);
    } catch (error) {
      setPayload(null);
      toast({
        variant: "destructive",
        title: "Impossible de charger la fiche",
        description: error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const applyClient = React.useCallback((client: ClientRow) => {
    setPayload((prev) => (prev ? { ...prev, client: { ...prev.client, ...client } } : prev));
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Chargement de la fiche…</p>;
  }

  if (!payload) {
    return (
      <p className="text-sm text-muted-foreground">
        Client introuvable.{" "}
        <Link href="/admin" className="text-foreground underline">
          Retour à la liste
        </Link>
      </p>
    );
  }

  const { client, answers, onboardingSteps, calendlySeat, controls } = payload;
  const seat = calendlySeat
    ? {
        status: calendlySeat.status,
        invitationStatus: calendlySeat.calendly_invitation_status,
      }
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex min-w-0 flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{client.email}</CardTitle>
                <CardDescription>
                  <code className="text-xs">{client.slug}</code>
                </CardDescription>
              </div>
              <Badge>{client.product_statut}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href={`/clients/${encodeURIComponent(client.slug)}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="mr-2 size-4" />
                Dashboard
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreditsTarget({ client, field: "rdv_used" })}
            >
              Crédits utilisés
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreditsTarget({ client, field: "rdv_total" })}
            >
              Quota RDV
            </Button>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="resume">Résumé</TabsTrigger>
            <TabsTrigger value="tasks">Tâches</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="calendly">Calendly</TabsTrigger>
            <TabsTrigger value="ops">Ops</TabsTrigger>
          </TabsList>

          <TabsContent value="resume" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Activité</CardTitle>
                <CardDescription>Événements déjà enregistrés pour ce client.</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityList answers={answers} steps={onboardingSteps} controls={controls} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tâches</CardTitle>
                <CardDescription>Suivi ops propre à ce client.</CardDescription>
              </CardHeader>
              <CardContent>
                <EnginClientTasks clientId={client.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="onboarding" className="mt-4 flex flex-col gap-4">
            <EnginOnboardingAnswersCard answers={answers} />
            <Card>
              <CardHeader>
                <CardTitle>Séquence emails</CardTitle>
                <CardDescription>Jobs payment_onboarding</CardDescription>
              </CardHeader>
              <CardContent>
                <EnginOnboardingStepsList steps={onboardingSteps} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendly" className="mt-4">
            <EnginConfirmCalendlyCard
              client={client}
              calendlySeat={calendlySeat}
              onUpdated={(updated) => {
                applyClient(updated);
                void load();
              }}
            />
          </TabsContent>

          <TabsContent value="ops" className="mt-4 flex flex-col gap-4">
            <EnginConnectionsCard
              client={client}
              calendlySeat={seat}
              onUpdated={(updated) => {
                applyClient(updated);
                void load();
              }}
            />
            <EnginClientDeleteCard client={client} />
          </TabsContent>
        </Tabs>
      </div>

      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Contrôles</CardTitle>
            <CardDescription>État dérivé des données client.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {controls.map((control) => (
              <button
                key={control.id}
                type="button"
                className="flex items-center gap-3 text-left text-sm"
                onClick={() => setTab(control.tab === "resume" ? "resume" : control.tab)}
              >
                <Checkbox checked={control.ok} disabled aria-hidden />
                <span className={control.ok ? "text-muted-foreground" : "text-foreground"}>
                  {control.label}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Renouvellement</CardTitle>
            <CardDescription>{renewalAdminLabel(client)}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p>{renewalAdminDetail(client)}</p>
            {client.renewal_choice_at ? (
              <p className="text-muted-foreground">
                Répondu le{" "}
                {new Date(client.renewal_choice_at).toLocaleString("fr-FR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            ) : null}
            {!client.renewal_choice && client.renewal_prompt_closed_at ? (
              <p className="text-muted-foreground">
                Fenêtre close le{" "}
                {new Date(client.renewal_prompt_closed_at).toLocaleString("fr-FR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Propriétés</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Vertical</dt>
                <dd>{client.client_type.toUpperCase()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Offre</dt>
                <dd>{conferenceOfferLabel(client.offer_type)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Crédits</dt>
                <dd className="tabular-nums">
                  {client.rdv_used} / {client.rdv_total}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Part RR</dt>
                <dd className="tabular-nums">
                  {client.rrSharePct.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}%
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pool</dt>
                <dd>{ELIGIBILITY_LABELS[client.eligibility]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Paiement</dt>
                <dd>{client.hasSucceededPayment ? "Reçu" : "Absent"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </aside>

      <EnginCreditsDialog
        client={creditsTarget?.client ?? null}
        field={creditsTarget?.field ?? null}
        open={Boolean(creditsTarget)}
        onOpenChange={(open) => {
          if (!open) setCreditsTarget(null);
        }}
        onUpdated={(updated) => {
          applyClient(updated);
          void load();
        }}
      />
    </div>
  );
}

function ActivityList({
  answers,
  steps,
  controls,
}: {
  answers: ClientOnboardingAnswers;
  steps: OnboardingStepStatus[];
  controls: OpsControl[];
}) {
  const items: { key: string; label: string; when: string | null }[] = [];
  if (answers.onboardingCompletedAt) {
    items.push({
      key: "onboarding",
      label: "Onboarding complété",
      when: answers.onboardingCompletedAt,
    });
  }
  for (const step of steps) {
    if (step.sentAt) {
      items.push({
        key: step.emailType,
        label: `Email ${step.emailType} envoyé`,
        when: step.sentAt,
      });
    }
  }
  if (controls.find((control) => control.id === "calendly")?.ok) {
    items.push({ key: "calendly", label: "Calendly confirmé", when: null });
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune activité enregistrée.</p>;
  }

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {items.map((item) => (
        <li key={item.key} className="flex justify-between gap-3 border-b border-border py-2">
          <span>{item.label}</span>
          <span className="text-muted-foreground">
            {item.when
              ? new Date(item.when).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}
