"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PRODUCT_STATUT_LABELS, type ClientCockpitData } from "@/lib/admin/clients/types";
import { retractionStatusLabel } from "@/lib/retraction";

type CockpitOverviewProps = {
  data: ClientCockpitData;
};

export function CockpitOverview({ data }: CockpitOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">État</CardTitle>
          <CardDescription>{data.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{PRODUCT_STATUT_LABELS[data.productStatut] ?? data.productStatut}</Badge>
            {data.dashboardMode ? (
              <Badge variant="secondary">{data.dashboardMode}</Badge>
            ) : null}
            {data.isPaid ? (
              <Badge className="border-emerald-500/40" variant="outline">
                Payé
              </Badge>
            ) : (
              <Badge variant="outline">Non payé</Badge>
            )}
          </div>
          <p>
            <span className="text-muted-foreground">CRM statut : </span>
            {data.statut}
          </p>
          <p>
            <span className="text-muted-foreground">RDV : </span>
            {data.scheduledAt
              ? new Date(data.scheduledAt).toLocaleString("fr-FR")
              : "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Onboardé : </span>
            {data.onboardingCompletedAt
              ? new Date(data.onboardingCompletedAt).toLocaleDateString("fr-FR")
              : "—"}
          </p>
          {data.category === "agence" || data.category === "comptable" ? (
            <>
              <p>
                <span className="text-muted-foreground">Rétractation : </span>
                {retractionStatusLabel(data.retractionStatus)}
              </p>
              {data.retractionEndsAt ? (
                <p>
                  <span className="text-muted-foreground">Fin délai : </span>
                  {new Date(data.retractionEndsAt).toLocaleDateString("fr-FR")}
                </p>
              ) : null}
              {data.retractionWaivedAt ? (
                <p>
                  <span className="text-muted-foreground">Renonciation : </span>
                  {new Date(data.retractionWaivedAt).toLocaleDateString("fr-FR")}
                </p>
              ) : null}
            </>
          ) : null}
          {data.dashboardLink ? (
            <p className="break-all font-mono text-xs text-muted-foreground">
              {data.dashboardLink}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Spécialités : </span>
            {data.form.specialites?.join(", ") || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Zone : </span>
            {data.form.zone || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Capacité : </span>
            {data.form.capacite ?? "—"}
          </p>
          {data.category === "comptable" ? (
            <>
              <p>
                <span className="text-muted-foreground">Honoraires annuels min. : </span>
                {data.form.honorairesAnnuelsMin != null
                  ? `${data.form.honorairesAnnuelsMin.toLocaleString("fr-FR")} € / an`
                  : "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Facturation : </span>
                {data.form.facturationMode ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Social / paie : </span>
                {data.form.socialPaieMode ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Honoraires ponctuels min. : </span>
                {data.form.honorairesPonctuelMin != null
                  ? `${data.form.honorairesPonctuelMin.toLocaleString("fr-FR")} €`
                  : "—"}
              </p>
            </>
          ) : (
            <>
              <p>
                <span className="text-muted-foreground">Budget ponctuel : </span>
                {data.form.budgetMinPonctuel ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Budget mensuel : </span>
                {data.form.budgetMinMensuel ?? "—"}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {data.timeline.map((step) => (
              <li key={step.id} className="flex gap-3">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    step.status === "done"
                      ? "bg-emerald-500"
                      : step.status === "active"
                        ? "bg-primary"
                        : "bg-border"
                  }`}
                />
                <div>
                  <p className="font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.meta || step.status}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Matches</CardTitle>
          <CardDescription>
            {data.matches.length} relation(s). Actions délivrance dans l&apos;onglet Délivrance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun match.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.matches.map((match) => (
                <li key={match.id} className="rounded-md border border-border p-3">
                  <p className="font-medium">{match.status}</p>
                  <p className="font-mono text-xs text-muted-foreground">{match.id}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
