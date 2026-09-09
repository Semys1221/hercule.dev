"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Niche } from "@/lib/admin/navigation";

import { BookingsOutreachConfigCard } from "./db/bookings-outreach-config-card";
import { BookingsVariablesPanel } from "./db/bookings-variables-panel";

type BookingsDbTabProps = {
  niche: Niche;
};

export function BookingsDbTab({ niche }: BookingsDbTabProps) {
  const [campaignLinked, setCampaignLinked] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Variables email</CardTitle>
          <CardDescription>
            Comparaison Supabase / Instantly pour les variables utilisées dans les séquences
            live de la niche.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingsVariablesPanel niche={niche} campaignLinked={campaignLinked} />
        </CardContent>
      </Card>

      <BookingsOutreachConfigCard
        niche={niche}
        onConfigChange={(config) => setCampaignLinked(Boolean(config?.campaign_linked))}
      />
    </div>
  );
}
