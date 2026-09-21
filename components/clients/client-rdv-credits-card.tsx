"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClientDashboardData } from "@/lib/clients/types";

type ClientRdvCreditsCardProps = {
  data: ClientDashboardData;
};

export function ClientRdvCreditsCard({ data }: ClientRdvCreditsCardProps) {
  const total = Math.max(data.rdvTotal, 1);
  const used = Math.min(data.rdvUsed, total);
  const progressPct = Math.round((used / total) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Crédits rendez-vous</CardTitle>
          <Badge variant="outline">
            {data.billing === "monthly" ? "Mensuel" : "Pack"}
          </Badge>
        </div>
        <CardDescription>
          {data.rdvUsed === 0
            ? "Vos crédits seront consommés au fur et à mesure des livraisons."
            : "Suivi de vos rendez-vous livrés."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-3xl font-semibold tabular-nums">
          {used}
          <span className="text-lg text-muted-foreground"> / {data.rdvTotal} RDV</span>
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
