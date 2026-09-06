"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/types";

type DetailRow = {
  label: string;
  value: string;
};

function buildDetailRows(data: DashboardData): DetailRow[] {
  const rows: DetailRow[] = [];
  const form = data.form;

  if (form.specialites && form.specialites.length > 0) {
    rows.push({
      label: "Spécialités",
      value: form.specialites.join(", "),
    });
  }

  if (form.zone?.trim()) {
    rows.push({
      label: "Zone géographique",
      value: form.zone.trim(),
    });
  }

  if (typeof form.capacite === "number" && form.capacite > 0) {
    rows.push({
      label: "Capacité mensuelle",
      value: `${form.capacite} demande${form.capacite > 1 ? "s" : ""}`,
    });
  }

  if (typeof form.budgetMinPonctuel === "number" && form.budgetMinPonctuel > 0) {
    rows.push({
      label: "Budget minimum (ponctuel)",
      value: `${form.budgetMinPonctuel.toLocaleString("fr-FR")} €`,
    });
  }

  if (typeof form.budgetMinMensuel === "number" && form.budgetMinMensuel > 0) {
    rows.push({
      label: "Budget minimum (mensuel)",
      value: `${form.budgetMinMensuel.toLocaleString("fr-FR")} € / mois`,
    });
  }

  return rows;
}

type DeliveryDetailsCardProps = {
  data: DashboardData;
};

export function DeliveryDetailsCard({ data }: DeliveryDetailsCardProps) {
  const rows = buildDetailRows(data);
  if (rows.length === 0) {
    return null;
  }

  return (
    <Card className="mt-5">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Détails de votre livraison</CardTitle>
        <CardDescription>
          Critères enregistrés lors de votre onboarding.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
              <dt className="min-w-[9rem] text-sm text-muted-foreground">{row.label}</dt>
              <dd className="text-sm font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
