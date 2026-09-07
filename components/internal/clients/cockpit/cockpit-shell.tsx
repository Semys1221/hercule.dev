"use client";

import { useCallback, useState } from "react";

import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CLIENTS_LIST_HREF,
  PRODUCT_ROOT_LABEL,
} from "@/lib/admin/funnels/ui-copy";
import { AUDIENCE_LABELS, pathToHref } from "@/lib/admin/navigation";
import type { ClientCockpitData } from "@/lib/admin/clients/types";

import { CockpitAdvanceStatut } from "./cockpit-advance-statut";
import { CockpitAppointmentsPanel } from "./cockpit-appointments-panel";
import { CockpitDeliverancePanel } from "./cockpit-deliverance-panel";
import { CockpitEmailPanel } from "./cockpit-email-panel";
import { CockpitHeaderActions } from "./cockpit-header-actions";
import { CockpitMatchPanel } from "./cockpit-match-panel";
import { CockpitOverview } from "./cockpit-overview";
import { CockpitPaymentLink } from "./cockpit-payment-link";
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
          { label: PRODUCT_ROOT_LABEL, href: "/internal/funnels" },
          { label: AUDIENCE_LABELS.agence, href: pathToHref(["agence"]) },
          { label: "Clients", href: CLIENTS_LIST_HREF },
          { label: title },
        ]}
        actions={<CockpitHeaderActions data={data} />}
      />

      <Tabs defaultValue="etat">
        <TabsList>
          <TabsTrigger value="etat">État</TabsTrigger>
          <TabsTrigger value="statut">Avancer statut</TabsTrigger>
          <TabsTrigger value="match">Match</TabsTrigger>
          <TabsTrigger value="deliverance">Délivrance</TabsTrigger>
          <TabsTrigger value="rdv">RDV</TabsTrigger>
          {data.category === "agence" ? (
            <>
              <TabsTrigger value="paiement">Paiement</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </>
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
        <TabsContent value="deliverance" className="mt-6">
          <CockpitDeliverancePanel data={data} onUpdated={refresh} />
        </TabsContent>
        <TabsContent value="rdv" className="mt-6">
          <CockpitAppointmentsPanel data={data} onUpdated={refresh} />
        </TabsContent>
        {data.category === "agence" ? (
          <>
            <TabsContent value="paiement" className="mt-6">
              <CockpitPaymentLink data={data} />
            </TabsContent>
            <TabsContent value="timeline" className="mt-6">
              <CockpitTimelineEditor data={data} onUpdated={refresh} />
            </TabsContent>
          </>
        ) : null}
        <TabsContent value="email" className="mt-6">
          <CockpitEmailPanel data={data} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
