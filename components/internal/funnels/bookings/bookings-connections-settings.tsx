"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Database,
  Link2,
  RefreshCw,
  Settings,
  XCircle,
} from "lucide-react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Niche } from "@/lib/admin/navigation";
import { NICHE_LABELS } from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

export type OutreachConfigView = {
  niche: Niche;
  instantly_campaign_id: string | null;
  instantly_list_id: string | null;
  calendly_event_type_uri: string | null;
  resolved_calendly_event_type_uri: string | null;
  calendly_configured: boolean;
  campaign_linked: boolean;
  list_linked: boolean;
  source: "database" | "env" | "none";
};

type SupabaseTableStatus = {
  table: string;
  connected: boolean;
  row_count: number | null;
  error: string | null;
};

type CalendlyEventTypeOption = {
  uri: string;
  name: string;
  scheduling_url: string | null;
};

type BookingsConnectionsSettingsProps = {
  niche: Niche;
  onConfigChange?: (config: OutreachConfigView | null) => void;
  onConfigSaved?: () => void;
  onRefresh?: () => void;
};

function truncateMiddle(value: string, max = 42): string {
  if (value.length <= max) {
    return value;
  }
  const head = Math.floor((max - 1) / 2);
  const tail = max - head - 1;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function eventTypeLabel(
  uri: string | null | undefined,
  eventTypes: CalendlyEventTypeOption[],
): string {
  if (!uri) {
    return "Non configuré";
  }
  const match = eventTypes.find((event) => event.uri === uri);
  return match?.name ?? truncateMiddle(uri);
}

function campaignLabel(
  campaignId: string | null | undefined,
  campaigns: Array<{ id: string; name: string }>,
): string {
  if (!campaignId) {
    return "Non liée";
  }
  const match = campaigns.find((campaign) => campaign.id === campaignId);
  return match?.name ?? truncateMiddle(campaignId, 28);
}

function StatusDot({
  connected,
  label,
}: {
  connected: boolean;
  label: string;
}) {
  return (
    <span
      className={cn(
        "size-2 rounded-full",
        connected ? "bg-emerald-500" : "bg-muted-foreground/35",
      )}
      title={`${label} : ${connected ? "connecté" : "non configuré"}`}
    />
  );
}

function ConnectionSummaryRow({
  connected,
  label,
  detail,
}: {
  connected: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {connected ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

export function BookingsConnectionsSettings({
  niche,
  onConfigChange,
  onConfigSaved,
  onRefresh,
}: BookingsConnectionsSettingsProps) {
  const [open, setOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([]);
  const [eventTypes, setEventTypes] = useState<CalendlyEventTypeOption[]>([]);
  const [config, setConfig] = useState<OutreachConfigView | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseTableStatus | null>(null);
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
      const [campaignsRes, configRes, eventTypesRes, supabaseRes] = await Promise.all([
        fetch("/api/admin/instantly-campaigns"),
        fetch(`/api/admin/niches/${niche}/outreach-config`),
        fetch("/api/admin/calendly/event-types"),
        fetch(`/api/admin/niches/${niche}/supabase-table`),
      ]);

      const campaignsBody = (await campaignsRes.json()) as {
        campaigns?: Array<{ id: string; name: string }>;
        error?: string;
      };
      const configBody = (await configRes.json()) as {
        config?: OutreachConfigView;
        error?: string;
      };
      const eventTypesBody = (await eventTypesRes.json()) as {
        eventTypes?: CalendlyEventTypeOption[];
        error?: string;
      };
      const supabaseBody = (await supabaseRes.json()) as {
        status?: SupabaseTableStatus;
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
      onConfigChange?.(nextConfig);
      setCampaignId(nextConfig?.instantly_campaign_id ?? "");
      setCalendlyUri(
        nextConfig?.calendly_event_type_uri ??
          nextConfig?.resolved_calendly_event_type_uri ??
          "",
      );

      if (eventTypesRes.ok) {
        setEventTypes(eventTypesBody.eventTypes ?? []);
      } else {
        setEventTypes([]);
      }

      if (supabaseRes.ok) {
        setSupabaseStatus(supabaseBody.status ?? null);
      } else {
        setSupabaseStatus({
          table: niche,
          connected: false,
          row_count: null,
          error: supabaseBody.error ?? "Statut Supabase indisponible",
        });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [niche, onConfigChange]);

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
      onConfigChange?.(body.config ?? null);
      onConfigSaved?.();
      setSuccess("Connexions enregistrées.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  const resolvedCalendlyUri =
    config?.resolved_calendly_event_type_uri ?? (calendlyUri.trim() || null);

  const statusSummary = useMemo(
    () => ({
      instantly: {
        connected: Boolean(config?.campaign_linked),
        detail: campaignLabel(config?.instantly_campaign_id, campaigns),
      },
      supabase: {
        connected: Boolean(supabaseStatus?.connected),
        detail: supabaseStatus?.connected
          ? `${supabaseStatus.table} (${supabaseStatus.row_count ?? 0} leads)`
          : supabaseStatus?.error ?? `public.${niche}`,
      },
      calendly: {
        connected: Boolean(config?.calendly_configured),
        detail: eventTypeLabel(resolvedCalendlyUri, eventTypes),
      },
    }),
    [campaigns, config, eventTypes, niche, resolvedCalendlyUri, supabaseStatus],
  );

  const allConnected =
    statusSummary.instantly.connected &&
    statusSummary.supabase.connected &&
    statusSummary.calendly.connected;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          aria-label={`Connexions ${NICHE_LABELS[niche]}`}
        >
          <span className="flex items-center gap-1" aria-hidden>
            <StatusDot connected={statusSummary.instantly.connected} label="Instantly" />
            <StatusDot connected={statusSummary.supabase.connected} label="Supabase" />
            <StatusDot connected={statusSummary.calendly.connected} label="Calendly" />
          </span>
          Connexions
          <Settings className="size-3.5 text-muted-foreground" />
          {!allConnected ? (
            <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[10px]">
              À configurer
            </Badge>
          ) : null}
        </Button>
        {onRefresh ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRefresh}
            aria-label="Rafraîchir le pipeline"
          >
            <RefreshCw className="size-4" />
          </Button>
        ) : null}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Connexions — {NICHE_LABELS[niche]}</SheetTitle>
            <SheetDescription>
              Campagne Instantly, table Supabase et event Calendly pour ce parcours.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            {error ? <InternalStatusAlert variant="error" message={error} /> : null}
            {success ? <InternalStatusAlert variant="success" message={success} /> : null}

            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : (
              <FieldGroup>
                <div className="grid gap-3 rounded-md border border-border bg-muted/30 p-3">
                  <ConnectionSummaryRow
                    connected={statusSummary.instantly.connected}
                    label="Instantly"
                    detail={statusSummary.instantly.detail}
                  />
                  <ConnectionSummaryRow
                    connected={statusSummary.supabase.connected}
                    label="Supabase"
                    detail={statusSummary.supabase.detail}
                  />
                  <ConnectionSummaryRow
                    connected={statusSummary.calendly.connected}
                    label="Calendly"
                    detail={statusSummary.calendly.detail}
                  />
                </div>
                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <Link2 className="size-3.5" />
                    Campagne Instantly
                  </FieldLabel>
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
                  {config?.instantly_campaign_id ? (
                    <p className="text-xs text-muted-foreground">
                      ID : {config.instantly_campaign_id}
                      {config.source !== "database" ? ` (source ${config.source})` : null}
                    </p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <Database className="size-3.5" />
                    Table Supabase
                  </FieldLabel>
                  <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                    <p className="font-medium">public.{niche}</p>
                    {supabaseStatus?.connected ? (
                      <p className="text-xs text-muted-foreground">
                        Connectée — {supabaseStatus.row_count ?? 0} lead
                        {(supabaseStatus.row_count ?? 0) > 1 ? "s" : ""}
                      </p>
                    ) : (
                      <p className="text-xs text-destructive">
                        {supabaseStatus?.error ?? "Table inaccessible"}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    La table est fixée par le parcours ({NICHE_LABELS[niche]}).
                  </p>
                </Field>

                <Field>
                  <FieldLabel>Event Calendly</FieldLabel>
                  <Select
                    value={calendlyUri || undefined}
                    onValueChange={setCalendlyUri}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((event) => (
                        <SelectItem key={event.uri} value={event.uri}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {resolvedCalendlyUri ? (
                    <p className="text-xs text-muted-foreground">
                      URI résolue : {truncateMiddle(resolvedCalendlyUri, 56)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Aucun event configuré — le pipeline Calendly restera vide.
                    </p>
                  )}
                </Field>

                <Button type="button" onClick={() => void onSave()} disabled={saving}>
                  {saving ? "Enregistrement…" : "Enregistrer les connexions"}
                </Button>
              </FieldGroup>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
