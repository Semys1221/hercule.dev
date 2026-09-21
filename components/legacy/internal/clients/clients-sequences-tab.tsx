"use client";

import { useMemo } from "react";

import { InternalStatusAlert } from "@/components/legacy/internal/funnels/ui/internal-status-alert";
import { SequenceWorkspace } from "@/components/legacy/internal/funnels/sequence-editor/sequence-workspace";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  clientsSequenceTabsForNiche,
  isClientsSequenceTabLive,
  resolveClientsSequenceEntry,
  type ClientsSequenceTabDef,
} from "@/lib/legacy/admin/clients/clients-sequence-tabs";
import { buildSequenceAdapter } from "@/lib/legacy/admin/sequences/build-sequence-adapter";
import type { Niche } from "@/lib/legacy/admin/navigation";

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
      editorKind={sequence.editorKind}
    />
  );
}

export function ClientsSequencesTab({ niche }: ClientsSequencesTabProps) {
  const liveTabs = useMemo(() => clientsSequenceTabsForNiche(niche), [niche]);
  const defaultTab = liveTabs[0]?.id ?? "payment-welcome";

  if (liveTabs.length === 0) {
    return (
      <InternalStatusAlert
        variant="info"
        title="Aucune séquence client"
        message="Aucune séquence post-onboarding n'est configurée pour cette niche."
      />
    );
  }

  return (
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
          <SequenceTabPanel tab={tab} niche={niche} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
