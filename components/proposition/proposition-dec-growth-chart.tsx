import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { DEC_CUMULATIVE_3M, DEC_ROI_LINE } from "@/components/conference/scenes/card-deck";

const BAR_MAX_PX = 132;

export function PropositionDecGrowthChart() {
  const maxWeight = DEC_CUMULATIVE_3M[DEC_CUMULATIVE_3M.length - 1]?.weight ?? 1;

  return (
    <section className="flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
          Scénario type · 3 mois
        </p>
        <h2 className="text-2xl font-light tracking-tight text-foreground">{DEC_ROI_LINE}</h2>
        <p className="text-xs text-muted-foreground">
          Illustration alignée sur la conférence Hercule — votre résultat dépend de votre conversion.
        </p>
      </div>

      <Card className="border-border bg-card/80 shadow-none">
        <CardHeader>
          <CardDescription className="text-center text-[10px] tracking-[0.18em] uppercase">
            CA cumulé
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-end justify-center gap-8 px-6 pb-8">
          {DEC_CUMULATIVE_3M.map((step) => (
            <div key={step.id} className="flex flex-1 flex-col items-center gap-3">
              <p className="text-lg font-light tabular-nums text-foreground">{step.amount}</p>
              <div
                className="flex w-full items-end justify-center"
                style={{ height: BAR_MAX_PX }}
              >
                <div
                  className="w-12 rounded-sm bg-foreground"
                  style={{
                    height: Math.max(10, (step.weight / maxWeight) * BAR_MAX_PX),
                  }}
                />
              </div>
              <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                {step.label}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
