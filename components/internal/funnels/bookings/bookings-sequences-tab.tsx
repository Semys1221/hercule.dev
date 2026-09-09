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
  BOOKINGS_SEQUENCE_TABS,
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
        message="Liez une campagne dans l'onglet DB avant d'éditer cette séquence."
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
    />
  );
}

export function BookingsSequencesTab({ niche }: BookingsSequencesTabProps) {
  const [config, setConfig] = useState<OutreachConfigView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/niches/${niche}/outreach-config`);
      const body = (await response.json()) as OutreachConfigView & { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Chargement config impossible");
      }
      setConfig(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [niche]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const campaignId = config?.instantly_campaign_id ?? null;
  const defaultTab = useMemo(
    () => BOOKINGS_SEQUENCE_TABS.find((tab) => isBookingsSequenceTabLive(tab, niche))?.id ?? "confirm",
    [niche],
  );

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <InternalStatusAlert variant="error" message={error} /> : null}

      <Tabs defaultValue={defaultTab} className="flex flex-col gap-4">
        <TabsList className="flex h-auto flex-wrap">
          {BOOKINGS_SEQUENCE_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {BOOKINGS_SEQUENCE_TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0">
            <SequenceTabPanel tab={tab} niche={niche} campaignId={campaignId} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
