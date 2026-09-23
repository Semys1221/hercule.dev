import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEC_OFFER } from "@/components/conference/scenes/card-deck";

export function PropositionDecOffer() {
  const story = DEC_OFFER;

  return (
    <section className="flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
          {story.title} · {story.niche}
        </p>
        <h2 className="text-2xl font-light tracking-tight text-foreground">
          Des rendez-vous sur votre cœur de métier
        </h2>
        <p className="text-sm text-muted-foreground">{story.scorePrice}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {story.caseBeats.map((beat) => (
          <Card key={beat.id} className="border-border bg-card/80 shadow-none">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] tracking-[0.2em] uppercase">
                {beat.kicker}
              </CardDescription>
              <CardTitle className="text-base font-medium leading-snug">
                {beat.pills ? (
                  <span className="flex flex-wrap gap-2">
                    {beat.pills.map((pill) => (
                      <span
                        key={pill}
                        className="rounded-md border border-border bg-background px-2 py-1 text-sm font-normal"
                      >
                        {pill}
                      </span>
                    ))}
                  </span>
                ) : (
                  beat.text
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card/80 shadow-none">
        <CardHeader>
          <CardDescription className="text-xs tracking-[0.18em] uppercase">
            Mécanique
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
          {story.equation.map((term, index) => (
            <span key={term.id} className="flex items-center gap-3">
              <span className="flex flex-col items-center gap-0.5 text-center">
                <span className="text-[10px] tracking-[0.16em] uppercase">{term.kicker}</span>
                <span className="text-foreground">{term.value}</span>
              </span>
              {term.joiner && index < story.equation.length - 1 ? (
                <span className="text-muted-foreground">{term.joiner}</span>
              ) : null}
            </span>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
