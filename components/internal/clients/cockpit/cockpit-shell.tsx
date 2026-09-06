"use client";

import { useCallback, useState } from "react";

import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ClientCockpitData } from "@/lib/admin/clients/types";

import { CockpitAdvanceStatut } from "./cockpit-advance-statut";
import { CockpitEmailPanel } from "./cockpit-email-panel";
import { CockpitMatchPanel } from "./cockpit-match-panel";
import { CockpitOverview } from "./cockpit-overview";
import { CockpitTimelineEditor } from "./cockpit-timeline-editor";

type ClientCockpitProps = {
  initial: ClientCockpitData;
};

export function ClientCockpit({ initial }: ClientCockpitProps) {
  const [data, setData] = useState(initial);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/admin/clients/${data.category}/${data.slug}`);
    if (!response.ok) return;
    const next = (await response.json()) as ClientCockpitData;
    setData(next);
  }, [data.category, data.slug]);

  const title = data.company ?? data.email;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <InternalPageHeader
        title={title}
        description={`${data.category} · ${data.slug}`}
        segments={[
          { label: "Internal", href: "/internal" },
          { label: "Clients", href: "/internal/clients" },
          { label: title },
        ]}
      />

      <Tabs defaultValue="etat">
        <TabsList>
          <TabsTrigger value="etat">État</TabsTrigger>
          <TabsTrigger value="statut">Avancer statut</TabsTrigger>
          <TabsTrigger value="match">Match</TabsTrigger>
          {data.category === "agence" ? (
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          ) : null}
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>
        <TabsContent value="etat" className="mt-6">
          <CockpitOverview data={data} />
        </TabsContent>
        <TabsContent value="statut" className="mt-6">
          <CockpitAdvanceStatut data={data} onUpdated={refresh} />
        </TabsContent>
        <TabsContent value="match" className="mt-6">
          <CockpitMatchPanel data={data} onUpdated={refresh} />
        </TabsContent>
        {data.category === "agence" ? (
          <TabsContent value="timeline" className="mt-6">
            <CockpitTimelineEditor data={data} onUpdated={refresh} />
          </TabsContent>
        ) : null}
        <TabsContent value="email" className="mt-6">
          <CockpitEmailPanel data={data} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
