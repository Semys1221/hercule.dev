"use client";

import { FaqPreviewAccordion } from "@/components/internal/funnels/faq-preview-accordion";
import type { FaqComponentConfig } from "@/lib/admin/funnels/schema";
import type { FaqAudience } from "@/lib/site/faq-types";
import { resolveFaqForComponent } from "@/lib/site/faq-data";

type FaqWidgetProps = {
  audience: FaqAudience;
  config: FaqComponentConfig;
  compact?: boolean;
};

export function FaqWidget({ audience, config, compact = false }: FaqWidgetProps) {
  const entries = resolveFaqForComponent(audience, config);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune question FAQ affichée.</p>;
  }

  return (
    <FaqPreviewAccordion
      entries={entries}
      className={compact ? "w-full rounded-lg border px-3" : "w-full rounded-xl border px-4 sm:px-6"}
    />
  );
}
