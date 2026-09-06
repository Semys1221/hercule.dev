"use client";

import { useEffect, useState } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClientCockpitData } from "@/lib/admin/clients/types";
import type { TimelineStep } from "@/lib/dashboard/types";

type CockpitTimelineEditorProps = {
  data: ClientCockpitData;
  onUpdated: () => Promise<void>;
};

export function CockpitTimelineEditor({ data, onUpdated }: CockpitTimelineEditorProps) {
  const [steps, setSteps] = useState<TimelineStep[]>(data.timeline);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setSteps(data.timeline);
  }, [data.timeline]);
  const [message, setMessage] = useState<{ variant: "success" | "error"; text: string } | null>(
    null,
  );

  function updateStep(index: number, patch: Partial<TimelineStep>) {
    setSteps((current) =>
      current.map((step, i) => (i === index ? { ...step, ...patch } : step)),
    );
  }

  async function save() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/admin/clients/${data.category}/${data.slug}/timeline`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeline: steps }),
        },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Enregistrement impossible");
      await onUpdated();
      setMessage({ variant: "success", text: "Timeline enregistrée." });
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
    <div className="max-w-xl space-y-4">
      {message ? (
        <InternalStatusAlert variant={message.variant} message={message.text} />
      ) : null}
      {steps.map((step, index) => (
        <div key={step.id} className="grid gap-2 rounded-md border border-border p-3">
          <Label htmlFor={`timeline-label-${step.id}`}>Étape {index + 1}</Label>
          <Input
            id={`timeline-label-${step.id}`}
            value={step.label}
            onChange={(event) => updateStep(index, { label: event.target.value })}
          />
          <Select
            value={step.status}
            onValueChange={(value) =>
              updateStep(index, { status: value as TimelineStep["status"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="done">done</SelectItem>
              <SelectItem value="active">active</SelectItem>
              <SelectItem value="pending">pending</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Meta (date, note)"
            value={step.meta ?? ""}
            onChange={(event) => updateStep(index, { meta: event.target.value })}
          />
        </div>
      ))}
      <Button type="button" disabled={pending} onClick={() => void save()}>
        {pending ? "Enregistrement…" : "Enregistrer la timeline"}
      </Button>
    </div>
  );
}
