import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LEGAL_ENTITY } from "@/lib/constants";
import { cn } from "@/lib/utils";

type CompanyOriginStep = {
  year: string;
  title: string;
  description: string;
};

const COMPANY_ORIGIN_STEPS: CompanyOriginStep[] = [
  {
    year: "2018",
    title: "Outil interne backend",
    description:
      "Création de l'outil pour notre propre activité de développement backend.",
  },
  {
    year: "2025",
    title: "Renommage Hercule",
    description:
      "L'outil interne devient Hercule et structure la plateforme commerciale actuelle.",
  },
  {
    year: "2026",
    title: "Nom de domaine",
    description: `Acquisition du nom de domaine ${LEGAL_ENTITY.website}.`,
  },
];

export function CompanyOriginTimeline() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-medium tracking-tight text-foreground">Chronologie</h2>
      <Card className="border-border bg-card/40 shadow-none">
        <CardContent className="p-5">
          <ol className="flex flex-col">
            {COMPANY_ORIGIN_STEPS.map((step, index) => {
              const isLast = index === COMPANY_ORIGIN_STEPS.length - 1;

              return (
                <li key={step.year} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className="mt-2 size-2 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                    {!isLast ? (
                      <span className="my-1 w-px flex-1 bg-border" aria-hidden />
                    ) : null}
                  </div>
                  <div className={cn("flex min-w-0 flex-1 flex-col gap-1.5", !isLast && "pb-6")}>
                    <Badge variant="outline" className="w-fit">
                      {step.year}
                    </Badge>
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}
