"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEMANDE_VERSO_CRITERIA } from "@/lib/commercial/qualification-criteria";
import type { DemandeVersoFields } from "@/lib/commercial/qualification-criteria";
import type { DashboardDeliveryPlan, DashboardEnterpriseBrief } from "@/lib/dashboard/types";

type DetailRow = {
  label: string;
  value: string;
};

function buildEnterpriseRows(brief: DashboardEnterpriseBrief): DetailRow[] {
  const rows: DetailRow[] = [];

  if (brief.companyLabel) {
    rows.push({ label: "Entreprise", value: brief.companyLabel });
  }
  if (brief.secteur) {
    rows.push({ label: "Secteur", value: brief.secteur });
  }
  if (brief.prestation) {
    rows.push({ label: "Prestation", value: brief.prestation });
  }
  if (brief.budget) {
    rows.push({ label: "Budget", value: brief.budget });
  }

  if (brief.verso) {
    for (const criterion of DEMANDE_VERSO_CRITERIA) {
      const key = criterion.key as keyof DemandeVersoFields;
      const value = brief.verso[key];
      if (value && value !== "—") {
        rows.push({ label: criterion.title, value });
      }
    }
  }

  return rows;
}

type DeliveryDetailsCardProps = {
  deliveryPlan: DashboardDeliveryPlan;
  enterpriseBrief?: DashboardEnterpriseBrief | null;
};

export function DeliveryDetailsCard({
  deliveryPlan,
  enterpriseBrief,
}: DeliveryDetailsCardProps) {
  const enterpriseRows = enterpriseBrief ? buildEnterpriseRows(enterpriseBrief) : [];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Détails de votre livraison</CardTitle>
        <CardDescription>
          Vérifiez votre formule et la demande en cours de mise en relation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <dl className="space-y-3">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
            <dt className="min-w-[9rem] text-sm text-muted-foreground">Formule</dt>
            <dd className="text-sm font-medium">{deliveryPlan.formulaLabel}</dd>
          </div>
        </dl>

        {enterpriseRows.length > 0 ? (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-medium">Fiche entreprise</p>
            <dl className="space-y-3">
              {enterpriseRows.map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                  <dt className="min-w-[9rem] text-sm text-muted-foreground">{row.label}</dt>
                  <dd className="text-sm font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="border-t border-border pt-4 text-sm text-muted-foreground">
            Aucune mise en relation en cours — recherche active sur vos critères.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
