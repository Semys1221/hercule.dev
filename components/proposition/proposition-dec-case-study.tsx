import { FirmMark, LeaderHeadcount } from "@/components/conference/scenes/case-proof";
import { CASE_STUDIES, firmBySlug } from "@/lib/conference/case-studies";
import { Card, CardContent } from "@/components/ui/card";

export function PropositionDecCaseStudy() {
  const copy = CASE_STUDIES.featured.accounting;
  const firm = firmBySlug(copy.slug);
  const rows = [
    { k: "Situation", v: copy.situation },
    { k: "Action", v: copy.action },
    { k: "Résultat", v: copy.resultLine },
  ];

  return (
    <section className="flex w-full max-w-3xl flex-col items-center gap-8">
      <div className="flex flex-col gap-2 text-center">
        <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
          Preuve terrain
        </p>
        <h2 className="text-2xl font-light tracking-tight text-foreground">
          Un cabinet DEC accompagné par Hercule
        </h2>
      </div>

      <div className="flex w-full max-w-xl flex-col items-center gap-6">
        <FirmMark firm={firm} />
        <div className="flex flex-col items-center gap-2">
          <p className="text-center text-xl font-medium tracking-tight text-foreground">
            {firm?.name ?? "Cabinet indépendant"}
          </p>
          <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
            Expertise comptable
          </p>
          <LeaderHeadcount leader={copy.leader} headcount={copy.headcount} />
        </div>

        <Card className="w-full border-border bg-card/80 shadow-none">
          <CardContent className="flex flex-col gap-4 pt-6">
            {rows.map((row) => (
              <div
                key={row.k}
                className="grid grid-cols-[7rem_1fr] items-baseline gap-4"
              >
                <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                  {row.k}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">{row.v}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {copy.sample ? (
          <p className="text-center text-xs text-muted-foreground">
            Exemple illustratif basé sur un déploiement type.
          </p>
        ) : null}
      </div>
    </section>
  );
}
