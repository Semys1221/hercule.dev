"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  COMPTABLE_NICHE_BENCHMARK,
  COMPTABLE_PERFORMANCE_REPORTING_INTRO,
} from "@/lib/admin/funnels/comptable-sales-copy";

export function SalesComptableNicheBenchmark() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {COMPTABLE_PERFORMANCE_REPORTING_INTRO}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {COMPTABLE_NICHE_BENCHMARK.disadvantages.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
              {COMPTABLE_NICHE_BENCHMARK.disadvantages.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {COMPTABLE_NICHE_BENCHMARK.advantages.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
              {COMPTABLE_NICHE_BENCHMARK.advantages.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
