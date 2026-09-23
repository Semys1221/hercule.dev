import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { CASE_STUDIES, formatEur } from "@/lib/conference/case-studies";

const MONTHS = ["Mois 1", "Mois 2", "Mois 3"] as const;

function StatFigure({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-3xl font-medium tabular-nums tracking-tight text-foreground">{value}</p>
      <p className="text-center text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}

export function PropositionDecCaseMetrics() {
  const metrics = CASE_STUDIES.metrics.accounting;
  const max = Math.max(...metrics.monthProfiles);

  return (
    <section className="flex w-full max-w-3xl flex-col gap-6">
      <Card className="border-border bg-card/80 shadow-none">
        <CardHeader>
          <CardDescription className="text-center text-[10px] tracking-[0.18em] uppercase">
            Profils qualifiés reçus
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-10">
          <div className="grid grid-cols-3 items-end gap-6">
            {metrics.monthProfiles.map((count, index) => (
              <div key={MONTHS[index]} className="flex flex-col items-center gap-3">
                <p className="text-3xl font-medium tabular-nums text-foreground">{count}</p>
                <div className="flex h-24 w-full items-end justify-center">
                  <div
                    className="w-10 rounded-t bg-foreground"
                    style={{ height: `${Math.round((count / max) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                  {MONTHS[index]}
                </p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <StatFigure value={`${metrics.conversionPct} %`} label="Conversion" />
            <StatFigure
              value={`${metrics.ticketMinEur}–${metrics.ticketMaxEur} €`}
              label="Panier moyen"
            />
            <StatFigure
              value={formatEur(metrics.cumulativeRevenueEur)}
              label="CA cumulé / 3 mois"
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
