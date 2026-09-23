import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BULLETS = [
  "Carte bancaire enregistrée — 0 € prélevé à l'inscription.",
  "Un rendez-vous visio qualifié pendant les 14 jours d'essai.",
  "Annulation avant la fin du 14e jour via le portail de facturation : aucune mensualité.",
  "Si vous poursuivez : 1 499 €/mois pour 10 rendez-vous qualifiés (garantie DEC).",
] as const;

export function PropositionTrialSummary() {
  return (
    <section className="flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-2xl font-light tracking-tight text-foreground">
          Essai gratuit 14 jours
        </h2>
        <p className="text-sm text-muted-foreground">
          Comme les cabinets de notre case study, vous pouvez valider la qualité des profils avant
          de vous engager sur l&apos;abonnement mensuel.
        </p>
      </div>
      <Card className="border-border bg-card/80 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-medium">En résumé</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex list-disc flex-col gap-3 pl-5 text-sm leading-relaxed text-muted-foreground">
            {BULLETS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
