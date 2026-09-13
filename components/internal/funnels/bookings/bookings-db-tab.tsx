"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Niche } from "@/lib/admin/navigation";

import { BookingsVariablesPanel } from "./db/bookings-variables-panel";

type BookingsDbTabProps = {
  niche: Niche;
  campaignLinked: boolean;
};

export function BookingsDbTab({ niche, campaignLinked }: BookingsDbTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Variables email</CardTitle>
          <CardDescription>
            Comparaison Supabase / Instantly pour les variables utilisées dans les séquences
            live de la niche. Campagne Instantly, table Supabase et event Calendly se configurent
            via le bouton Connexions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingsVariablesPanel niche={niche} campaignLinked={campaignLinked} />
        </CardContent>
      </Card>
    </div>
  );
}
