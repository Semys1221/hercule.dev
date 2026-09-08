"use client";

import { useCallback, useEffect, useState } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
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
import type { Niche } from "@/lib/admin/navigation";

type OutreachConfigView = {
  niche: Niche;
  instantly_campaign_id: string | null;
  calendly_event_type_uri: string | null;
  resolved_calendly_event_type_uri: string | null;
  calendly_configured: boolean;
  campaign_linked: boolean;
};

type BookingsDbTabProps = {
  niche: Niche;
};

export function BookingsDbTab({ niche }: BookingsDbTabProps) {
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([]);
  const [config, setConfig] = useState<OutreachConfigView | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [calendlyUri, setCalendlyUri] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaignsRes, configRes] = await Promise.all([
        fetch("/api/admin/instantly-campaigns"),
        fetch(`/api/admin/niches/${niche}/outreach-config`),
      ]);
      const campaignsBody = (await campaignsRes.json()) as {
        campaigns?: Array<{ id: string; name: string }>;
        error?: string;
      };
      const configBody = (await configRes.json()) as {
        config?: OutreachConfigView;
        error?: string;
      };
      if (!campaignsRes.ok) {
        throw new Error(campaignsBody.error ?? "Campagnes Instantly indisponibles");
      }
      if (!configRes.ok) {
        throw new Error(configBody.error ?? "Config niche indisponible");
      }
      setCampaigns(campaignsBody.campaigns ?? []);
      const nextConfig = configBody.config ?? null;
      setConfig(nextConfig);
      setCampaignId(nextConfig?.instantly_campaign_id ?? "");
      setCalendlyUri(nextConfig?.calendly_event_type_uri ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [niche]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave() {
    if (!campaignId.trim()) {
      setError("Sélectionnez une campagne Instantly.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/niches/${niche}/outreach-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instantly_campaign_id: campaignId,
          calendly_event_type_uri: calendlyUri.trim() || null,
        }),
      });
      const body = (await response.json()) as { error?: string; config?: OutreachConfigView };
      if (!response.ok) {
        throw new Error(body.error ?? "Enregistrement impossible");
      }
      setConfig(body.config ?? null);
      setSuccess("Configuration enregistrée.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration outreach</CardTitle>
        <CardDescription>
          Liez la campagne Instantly et l&apos;event type Calendly de cette niche.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? <InternalStatusAlert variant="error" message={error} /> : null}
        {success ? <InternalStatusAlert variant="success" message={success} /> : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <FieldGroup>
            <Field>
              <FieldLabel>Campagne Instantly</FieldLabel>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une campagne" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Calendly event type URI (override)</FieldLabel>
              <Input
                value={calendlyUri}
                onChange={(event) => setCalendlyUri(event.target.value)}
                placeholder={config?.resolved_calendly_event_type_uri ?? "https://api.calendly.com/event_types/…"}
              />
              <p className="text-xs text-muted-foreground">
                Résolu actuellement :{" "}
                {config?.resolved_calendly_event_type_uri ?? "non configuré"}
              </p>
            </Field>

            <Button type="button" onClick={() => void onSave()} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </FieldGroup>
        )}
      </CardContent>
    </Card>
  );
}
