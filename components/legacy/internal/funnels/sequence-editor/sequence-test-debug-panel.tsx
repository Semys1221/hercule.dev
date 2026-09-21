"use client";

import { useEffect, useState } from "react";

import { SequenceHistoryTab } from "@/components/legacy/internal/funnels/sequence-editor/sequence-history-tab";
import type { SequenceStep } from "@/components/legacy/internal/funnels/sequence-editor/types";
import { InternalStatusAlert } from "@/components/legacy/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Niche } from "@/lib/legacy/admin/navigation";

type LastTestResult = {
  resendEmailId: string | null;
  jobId: string | null;
  providerLabel: string;
  recipientEmail: string;
  stepId: string;
  at: number;
};

type SequenceTestDebugPanelProps = {
  slug: string;
  niche: Niche;
  provider: "resend" | "instantly";
  editorKind: "booking" | "bypass" | "reply_agent" | string;
  campaignId?: string | null;
  steps: SequenceStep[];
  defaultRecipientEmail?: string;
  historyRefresh: number;
  onHistoryRefresh: () => void;
  onOpenLogs: (job: {
    id: string;
    provider: "resend" | "instantly";
  }) => void;
};

function opsHint(editorKind: string, provider: "resend" | "instantly"): string {
  if (editorKind === "bypass") {
    return "Test E1–E3 : rendu template Instantly bypass envoyé via Resend ops. L’historique ci-dessous liste les jobs Instantly de production (pas les previews ops).";
  }
  if (editorKind === "reply_agent") {
    return "Test reply agent : dump du prompt vers Resend ops. Aucun lead Instantly n’est touché. L’historique production reste côté Instantly/cron.";
  }
  if (provider === "resend") {
    return "Test booking : envoi Resend réel + ligne dans booking_email_jobs (si un lead test existe pour la niche).";
  }
  return "Envoi test ops — vérifier destinataire et step avant envoi.";
}

export function SequenceTestDebugPanel({
  slug,
  niche,
  provider,
  editorKind,
  campaignId,
  steps,
  defaultRecipientEmail,
  historyRefresh,
  onHistoryRefresh,
  onOpenLogs,
}: SequenceTestDebugPanelProps) {
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail ?? "");
  const [stepId, setStepId] = useState(steps[0]?.id ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<LastTestResult | null>(null);

  useEffect(() => {
    setRecipientEmail(defaultRecipientEmail ?? "");
  }, [defaultRecipientEmail]);

  useEffect(() => {
    if (!steps.some((step) => step.id === stepId)) {
      setStepId(steps[0]?.id ?? "");
    }
  }, [stepId, steps]);

  const selectedStep = steps.find((step) => step.id === stepId);
  const needsCampaign = editorKind === "bypass" || editorKind === "reply_agent";
  const campaignBlocked = needsCampaign && !campaignId;

  const handleSend = async () => {
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/sequences/${slug}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          stepId,
          recipientEmail,
          subject: selectedStep?.subject,
          body: selectedStep?.body,
          ...(campaignId ? { campaignId } : {}),
        }),
      });
      const body = (await response.json()) as {
        error?: string;
        resendEmailId?: string;
        jobId?: string | null;
      };
      if (!response.ok) {
        throw new Error(
          typeof body.error === "string"
            ? body.error
            : "Envoi test impossible",
        );
      }

      const providerLabel =
        editorKind === "bypass" || editorKind === "reply_agent"
          ? "ops (preview Resend)"
          : "Resend";
      const result: LastTestResult = {
        resendEmailId: body.resendEmailId ?? null,
        jobId: body.jobId ?? null,
        providerLabel,
        recipientEmail,
        stepId,
        at: Date.now(),
      };
      setLastResult(result);
      setSuccess(
        `Email test envoyé (${providerLabel} ${body.resendEmailId ?? "—"}).`,
      );
      onHistoryRefresh();

      if (body.jobId) {
        onOpenLogs({ id: body.jobId, provider: "resend" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Envoi test impossible";
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test &amp; Debug</CardTitle>
          <CardDescription>{opsHint(editorKind, provider)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-md border px-2 py-1 font-mono">
              kind={editorKind}
            </span>
            <span className="rounded-md border px-2 py-1 font-mono">
              provider={provider}
            </span>
            <span className="rounded-md border px-2 py-1 font-mono">
              campaign={campaignId ? `${campaignId.slice(0, 8)}…` : "none"}
            </span>
          </div>

          {campaignBlocked ? (
            <InternalStatusAlert
              variant="info"
              title="Campagne Instantly requise"
              message="Liez une campagne via Connexions avant d’envoyer un test bypass / reply agent."
            />
          ) : null}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ops-test-recipient">Destinataire</FieldLabel>
              <Input
                id="ops-test-recipient"
                type="email"
                value={recipientEmail}
                onChange={(event) => setRecipientEmail(event.target.value)}
                placeholder="ops@hercule.dev"
                disabled={campaignBlocked}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ops-test-step">Step</FieldLabel>
              <Select
                value={stepId}
                onValueChange={setStepId}
                disabled={campaignBlocked || steps.length === 0}
              >
                <SelectTrigger id="ops-test-step">
                  <SelectValue placeholder="Choisir un step" />
                </SelectTrigger>
                <SelectContent>
                  {steps.map((step) => (
                    <SelectItem key={step.id} value={step.id}>
                      {step.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          {error ? <InternalStatusAlert variant="error" message={error} /> : null}
          {success ? (
            <InternalStatusAlert variant="success" message={success} />
          ) : null}

          {lastResult ? (
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">Dernier test ops</p>
              <p className="mt-1 text-muted-foreground">
                {lastResult.recipientEmail} · step{" "}
                <code className="font-mono text-xs">{lastResult.stepId}</code> ·{" "}
                {lastResult.providerLabel}{" "}
                <code className="font-mono text-xs">
                  {lastResult.resendEmailId ?? "—"}
                </code>
              </p>
              {lastResult.jobId ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    onOpenLogs({ id: lastResult.jobId!, provider: "resend" })
                  }
                >
                  Ouvrir les logs du job
                </Button>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Pas de job historique pour ce type de test — résultat ops
                  uniquement (Resend id ci-dessus).
                </p>
              )}
            </div>
          ) : null}

          <Button
            type="button"
            disabled={
              sending ||
              campaignBlocked ||
              !recipientEmail.trim() ||
              !stepId
            }
            onClick={() => void handleSend()}
          >
            {sending ? "Envoi…" : "Envoyer le test"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique / Debug</CardTitle>
          <CardDescription>
            Jobs des 30 derniers jours. Cliquez Logs pour inspecter le payload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SequenceHistoryTab
            slug={slug}
            niche={niche}
            refreshToken={historyRefresh}
            onSelectJob={(job) => {
              onOpenLogs({ id: job.id, provider: job.provider });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
