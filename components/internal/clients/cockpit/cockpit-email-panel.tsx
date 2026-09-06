"use client";

import { useMemo, useState } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEmailSequences } from "@/lib/admin/email-sequences/registry";
import type { ClientCockpitData } from "@/lib/admin/clients/types";
import type { BookingEmailType } from "@/lib/booking-communication/types";

type CockpitEmailPanelProps = {
  data: ClientCockpitData;
};

export function CockpitEmailPanel({ data }: CockpitEmailPanelProps) {
  const options = useMemo(() => {
    const sequences = getEmailSequences(data.category);
    return sequences.flatMap((sequence) =>
      sequence.steps
        .filter((step) => Boolean(step.emailType))
        .map((step) => ({
          value: step.emailType as BookingEmailType,
          label: `${sequence.name} — ${step.label}`,
        })),
    );
  }, [data.category]);

  const [emailType, setEmailType] = useState<string>(options[0]?.value ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ variant: "success" | "error"; text: string } | null>(
    null,
  );

  async function send() {
    if (!emailType) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/clients/${data.category}/${data.slug}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailType }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Envoi impossible");
      setMessage({ variant: "success", text: `Email ${emailType} envoyé.` });
    } catch (error) {
      setMessage({
        variant: "error",
        text: error instanceof Error ? error.message : "Erreur",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      {message ? (
        <InternalStatusAlert variant={message.variant} message={message.text} />
      ) : null}
      <Select value={emailType} onValueChange={setEmailType}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Type d'email" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={`${option.value}-${option.label}`} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" disabled={!emailType || pending} onClick={() => void send()}>
        {pending ? "Envoi…" : "Envoyer"}
      </Button>
    </div>
  );
}
