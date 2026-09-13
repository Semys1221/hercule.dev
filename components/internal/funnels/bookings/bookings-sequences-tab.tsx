"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { SequenceWorkspace } from "@/components/internal/funnels/sequence-editor/sequence-workspace";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  bookingsSequenceTabsForNiche,
  isBookingsSequenceTabLive,
  resolveBookingsSequenceEntry,
  type BookingsSequenceTabDef,
} from "@/lib/admin/bookings/bookings-sequence-tabs";
import { buildSequenceAdapter } from "@/lib/admin/sequences/build-sequence-adapter";
import type { Niche } from "@/lib/admin/navigation";

type OutreachConfigView = {
  instantly_campaign_id: string | null;
  campaign_linked: boolean;
};

type BookingsSequencesTabProps = {
  niche: Niche;
  connectionsRevision?: number;
};

function SequenceTabEmptyState({ tab }: { tab: BookingsSequenceTabDef }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>Non applicable pour cette niche</EmptyTitle>
        <EmptyDescription>
          {tab.description
            ? `${tab.description} Copy dédié requis avant activation — ne pas réutiliser le wording agence.`
            : "Cette séquence n'est pas configurée pour cette niche."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function SequenceTabPanel({
  tab,
  niche,
  campaignId,
}: {
  tab: BookingsSequenceTabDef;
  niche: Niche;
  campaignId: string | null;
}) {
  if (!isBookingsSequenceTabLive(tab, niche)) {
    return <SequenceTabEmptyState tab={tab} />;
  }

  const sequence = resolveBookingsSequenceEntry(tab, niche);
  if (!sequence) {
    return (
      <InternalStatusAlert
        variant="info"
        title="Séquence introuvable"
        message={`Aucune entrée registry pour ${tab.resolveSlug(niche)}.`}
      />
    );
  }

  if (tab.needsCampaign && !campaignId) {
    return (
      <InternalStatusAlert
        variant="info"
        title="Campagne Instantly non liée"
        message="Liez une campagne Instantly via Connexions avant d'éditer cette séquence."
      />
    );
  }

  const { adapter } = buildSequenceAdapter(sequence, niche, campaignId);
  if (!adapter) {
    return (
      <InternalStatusAlert
        variant="info"
        title="Éditeur indisponible"
        message="Impossible de construire l'adaptateur pour cette séquence."
      />
    );
  }

  return (
    <SequenceWorkspace
      title={sequence.name}
      description={tab.description ?? sequence.description}
      adapter={adapter}
      campaignId={campaignId}
    />
  );
}

export function BookingsSequencesTab({
  niche,
  connectionsRevision = 0,
}: BookingsSequencesTabProps) {
  const [config, setConfig] = useState<OutreachConfigView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/niches/${niche}/outreach-config`);
      const body = (await response.json()) as {
        config?: OutreachConfigView;
        error?: string;
      };
      // #region agent log
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "cf0893",
        },
        body: JSON.stringify({
          sessionId: "cf0893",
          runId: "post-fix",
          hypothesisId: "H1",
          location: "bookings-sequences-tab.tsx:loadConfig",
          message: "outreach-config response shape",
          data: {
            niche,
            ok: response.ok,
            nestedCampaignId: body.config?.instantly_campaign_id ?? null,
            nestedCampaignLinked: body.config?.campaign_linked ?? null,
            hasConfigKey: Boolean(body.config),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (!response.ok) {
        throw new Error(body.error ?? "Chargement config impossible");
      }
      setConfig(body.config ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [niche]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig, connectionsRevision]);

  const campaignId = config?.instantly_campaign_id ?? null;
  // #region agent log
  useEffect(() => {
    if (loading) return;
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "cf0893",
      },
      body: JSON.stringify({
        sessionId: "cf0893",
        runId: "post-fix",
        hypothesisId: "H1-H4",
        location: "bookings-sequences-tab.tsx:campaignId",
        message: "derived campaignId for sequences tab",
        data: {
          niche,
          campaignId,
          configCampaignLinked: config?.campaign_linked ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [loading, niche, campaignId, config]);
  // #endregion

  const liveTabs = useMemo(() => bookingsSequenceTabsForNiche(niche), [niche]);
  const defaultTab = liveTabs[0]?.id ?? "confirm";
  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "66e41f",
      },
      body: JSON.stringify({
        sessionId: "66e41f",
        runId: "post-fix",
        hypothesisId: "H1",
        location: "bookings-sequences-tab.tsx:liveTabs",
        message: "bookings sequence tabs for niche",
        data: {
          niche,
          tabCount: liveTabs.length,
          tabIds: liveTabs.map((tab) => tab.id),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [niche, liveTabs]);
  // #endregion

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <InternalStatusAlert variant="error" message={error} /> : null}

      <Tabs defaultValue={defaultTab} className="flex flex-col gap-4">
        <TabsList className="flex h-auto flex-wrap">
          {liveTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {liveTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0">
            <SequenceTabPanel tab={tab} niche={niche} campaignId={campaignId} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
