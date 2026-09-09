"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  formatExcludedEmailsText,
  parseExcludedEmailsText,
} from "@/lib/admin/deliverability/settings";
import type { DeliverabilitySettings } from "@/lib/admin/deliverability/types";

const formSchema = z.object({
  health_score_warn_below: z.coerce.number().int().min(0).max(100),
  inbox_rate_warn_below: z.coerce.number().min(0).max(1),
  refresh_minutes: z.coerce.number().int().min(1).max(120),
  excluded_emails_text: z.string(),
  auto_pause_on_alert: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

function settingsToForm(settings: DeliverabilitySettings): FormValues {
  return {
    health_score_warn_below: settings.health_score_warn_below,
    inbox_rate_warn_below: settings.inbox_rate_warn_below,
    refresh_minutes: settings.refresh_minutes,
    excluded_emails_text: formatExcludedEmailsText(settings.excluded_emails),
    auto_pause_on_alert: settings.auto_pause_on_alert,
  };
}

export function DeliverabilitySettingsForm({
  settings,
  onSaved,
}: {
  settings: DeliverabilitySettings;
  onSaved: (settings: DeliverabilitySettings) => void;
}) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: settingsToForm(settings),
  });

  React.useEffect(() => {
    form.reset(settingsToForm(settings));
  }, [settings, form]);

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      const response = await fetch("/api/admin/deliverability/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          health_score_warn_below: values.health_score_warn_below,
          inbox_rate_warn_below: values.inbox_rate_warn_below,
          refresh_minutes: values.refresh_minutes,
          excluded_emails: parseExcludedEmailsText(values.excluded_emails_text),
          auto_pause_on_alert: values.auto_pause_on_alert,
        }),
      });
      const json = (await response.json()) as {
        settings?: DeliverabilitySettings;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(json.error ?? "Enregistrement impossible");
      }
      if (!json.settings) {
        throw new Error("Réponse settings invalide");
      }
      onSaved(json.settings);
      toast({ title: "Paramètres enregistrés" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Enregistrement impossible";
      setError(message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres du panneau</CardTitle>
        <CardDescription>
          Seuils d&apos;alerte, cache de rafraîchissement et exclusions. L&apos;auto-pause reste
          désactivée par défaut pour éviter toute action destructive automatique.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {error ? <InternalStatusAlert variant="error" message={error} /> : null}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="health_score_warn_below">Seuil health score (alerte)</FieldLabel>
              <Input
                id="health_score_warn_below"
                type="number"
                min={0}
                max={100}
                {...form.register("health_score_warn_below")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="inbox_rate_warn_below">Seuil inbox rate (0–1)</FieldLabel>
              <Input
                id="inbox_rate_warn_below"
                type="number"
                min={0}
                max={1}
                step={0.01}
                {...form.register("inbox_rate_warn_below")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="refresh_minutes">Cache snapshot (minutes)</FieldLabel>
              <Input
                id="refresh_minutes"
                type="number"
                min={1}
                max={120}
                {...form.register("refresh_minutes")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="excluded_emails_text">Emails exclus (un par ligne)</FieldLabel>
              <Textarea
                id="excluded_emails_text"
                rows={6}
                placeholder="ops@example.com"
                {...form.register("excluded_emails_text")}
              />
              <FieldDescription>
                Ces comptes restent listés mais sont exclus des agrégats et des checks bulk.
              </FieldDescription>
            </Field>
            <Field orientation="horizontal">
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor="auto_pause_on_alert">Auto-pause sur alerte</FieldLabel>
                <FieldDescription>
                  Dangereux — laisse désactivé sauf procédure ops explicite.
                </FieldDescription>
              </div>
              <Switch
                id="auto_pause_on_alert"
                checked={form.watch("auto_pause_on_alert")}
                onCheckedChange={(checked) => form.setValue("auto_pause_on_alert", checked)}
              />
            </Field>
          </FieldGroup>

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
