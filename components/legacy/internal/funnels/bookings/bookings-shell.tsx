"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Niche } from "@/lib/legacy/admin/navigation";

import { BookingsConnectionsSettings } from "./bookings-connections-settings";
import { BookingsTable } from "./bookings-table";
import { BookingsSequencesTab } from "./bookings-sequences-tab";

type BookingsShellProps = {
  niche: Niche;
};

export function BookingsShell({ niche }: BookingsShellProps) {
  const searchParams = useSearchParams();
  const [connectionsRevision, setConnectionsRevision] = useState(0);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [activeTab, setActiveTab] = useState<"pipeline" | "sequences">("pipeline");

  useEffect(() => {
    if (searchParams.get("tab") === "sequences") {
      setActiveTab("sequences");
    }
  }, [searchParams]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "pipeline" | "sequences")}
      className="flex min-w-0 flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="sequences">Séquences</TabsTrigger>
        </TabsList>

        <BookingsConnectionsSettings
          niche={niche}
          onConfigSaved={() => setConnectionsRevision((value) => value + 1)}
          onRefresh={() => setRefreshNonce((value) => value + 1)}
        />
      </div>

      <TabsContent value="pipeline" className="mt-0">
        <BookingsTable
          niche={niche}
          connectionsRevision={connectionsRevision}
          refreshNonce={refreshNonce}
        />
      </TabsContent>
      <TabsContent value="sequences" className="mt-0">
        <BookingsSequencesTab niche={niche} connectionsRevision={connectionsRevision} />
      </TabsContent>
    </Tabs>
  );
}
