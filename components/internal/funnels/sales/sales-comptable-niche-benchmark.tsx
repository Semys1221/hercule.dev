"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  COMPTABLE_NICHE_BENCHMARK,
  COMPTABLE_PERFORMANCE_REPORTING_INTRO,
} from "@/lib/admin/funnels/comptable-sales-copy";
import {
  CIF_NICHE_BENCHMARK,
  CIF_PERFORMANCE_REPORTING_INTRO,
} from "@/lib/admin/funnels/cif-sales-copy";
import type { Audience } from "@/lib/admin/navigation";

type SalesComptableNicheBenchmarkProps = {
  audience?: Audience;
};

export function SalesComptableNicheBenchmark({
  audience = "comptable",
}: SalesComptableNicheBenchmarkProps) {
  const isCif = audience === "cif";
  const benchmark = isCif ? CIF_NICHE_BENCHMARK : COMPTABLE_NICHE_BENCHMARK;
  const intro = isCif ? CIF_PERFORMANCE_REPORTING_INTRO : COMPTABLE_PERFORMANCE_REPORTING_INTRO;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted-foreground">{intro}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{benchmark.disadvantages.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
              {benchmark.disadvantages.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{benchmark.advantages.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
              {benchmark.advantages.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
