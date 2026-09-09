"use client";

import { useEffect, useState } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Niche } from "@/lib/admin/navigation";

import type { SequenceStep } from "./types";

type SequenceTestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  niche: Niche;
  steps: SequenceStep[];
  defaultRecipientEmail?: string;
  onSent?: () => void;
};

export function SequenceTestDialog({
  open,
  onOpenChange,
  slug,
  niche,
  steps,
  defaultRecipientEmail,
  onSent,
}: SequenceTestDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail ?? "");
  const [stepId, setStepId] = useState(steps[0]?.id ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRecipientEmail(defaultRecipientEmail ?? "");
      setStepId(steps[0]?.id ?? "");
      setError(null);
      setSuccess(null);
    }
  }, [defaultRecipientEmail, open, steps]);

  const selectedStep = steps.find((step) => step.id === stepId);

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
        }),
      });
      const body = (await response.json()) as { error?: string; resendEmailId?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Envoi test impossible");
      }
      setSuccess(`Email test envoyé (Resend ${body.resendEmailId ?? "—"}).`);
      onSent?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi test impossible");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tester la séquence</DialogTitle>
          <DialogDescription>
            Envoie un step vers un email ops sans avancer le lead.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="test-recipient">Destinataire</FieldLabel>
            <Input
              id="test-recipient"
              type="email"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              placeholder="ops@hercule.dev"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="test-step">Step</FieldLabel>
            <Select value={stepId} onValueChange={setStepId}>
              <SelectTrigger id="test-step">
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
        {success ? <InternalStatusAlert variant="success" message={success} /> : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button
            type="button"
            disabled={sending || !recipientEmail.trim() || !stepId}
            onClick={() => void handleSend()}
          >
            {sending ? "Envoi…" : "Envoyer le test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
