"use client";

import { useMemo } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { SequenceWorkspace } from "@/components/internal/funnels/sequence-editor/sequence-workspace";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CLIENTS_SEQUENCE_TABS,
  isClientsSequenceTabLive,
  resolveClientsSequenceEntry,
  type ClientsSequenceTabDef,
} from "@/lib/admin/clients/clients-sequence-tabs";
import { buildSequenceAdapter } from "@/lib/admin/sequences/build-sequence-adapter";
import type { Niche } from "@/lib/admin/navigation";

type ClientsSequencesTabProps = {
  niche: Niche;
};

function SequenceTabEmptyState({ tab }: { tab: ClientsSequenceTabDef }) {
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
}: {
  tab: ClientsSequenceTabDef;
  niche: Niche;
}) {
  if (!isClientsSequenceTabLive(tab, niche)) {
    return <SequenceTabEmptyState tab={tab} />;
  }

  const sequence = resolveClientsSequenceEntry(tab, niche);
  if (!sequence) {
    return (
      <InternalStatusAlert
        variant="info"
        title="Séquence introuvable"
        message={`Aucune entrée registry pour ${tab.resolveSlug(niche)}.`}
      />
    );
  }

  const { adapter } = buildSequenceAdapter(sequence, niche, null);
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

export function ClientsSequencesTab({ niche }: ClientsSequencesTabProps) {
  const defaultTab = useMemo(
    () =>
      CLIENTS_SEQUENCE_TABS.find((tab) => isClientsSequenceTabLive(tab, niche))?.id ??
      "payment-welcome",
    [niche],
  );

  return (
    <Tabs defaultValue={defaultTab} className="flex flex-col gap-4">
      <TabsList className="flex h-auto flex-wrap">
        {CLIENTS_SEQUENCE_TABS.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {CLIENTS_SEQUENCE_TABS.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-0">
          <SequenceTabPanel tab={tab} niche={niche} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
