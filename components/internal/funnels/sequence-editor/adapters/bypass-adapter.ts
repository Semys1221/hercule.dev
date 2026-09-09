import type { BypassTemplateKey } from "@/lib/instantly-bypass/types";
import type { Niche } from "@/lib/admin/navigation";

import type { SequenceEditorAdapter, SequenceStep } from "../types";

type BypassAdapterOptions = {
  slug: string;
  niche: Niche;
  campaignId: string;
  templateKeys: BypassTemplateKey[];
  stepMeta: Array<{ id: string; label: string; delay: string; templateKey: BypassTemplateKey }>;
};

export function createBypassAdapter(options: BypassAdapterOptions): SequenceEditorAdapter {
  const { slug, niche, campaignId, stepMeta } = options;

  return {
    slug,
    niche,
    provider: "instantly",
    historyFilter: () => ({
      templateKeys: stepMeta.map((meta) => meta.templateKey),
    }),
    async loadVariables() {
      const response = await fetch(`/api/admin/niches/${niche}/variables`);
      const body = (await response.json()) as { variables?: string[]; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Variables indisponibles");
      }
      return body.variables ?? [];
    },
    async load() {
      const response = await fetch(
        `/api/admin/instantly-bypass/${campaignId}/templates`,
      );
      const body = (await response.json()) as {
        templates?: Array<{
          template_key: string;
          subject: string;
          body_html: string;
        }>;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Chargement impossible");
      }
      const byKey = new Map(
        (body.templates ?? []).map((row) => [row.template_key, row]),
      );
      return stepMeta.map((meta) => {
        const row = byKey.get(meta.templateKey);
        return {
          id: meta.id,
          label: meta.label,
          delay: meta.delay,
          subject: row?.subject ?? "",
          body: row?.body_html ?? "",
          bodyFormat: "html",
        };
      });
    },
    async save(steps: SequenceStep[]) {
      const templates = stepMeta.map((meta, index) => ({
        template_key: meta.templateKey,
        subject: steps[index]?.subject ?? "",
        body_html: steps[index]?.body ?? "",
      }));
      const response = await fetch(
        `/api/admin/instantly-bypass/${campaignId}/templates`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templates }),
        },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Enregistrement impossible");
      }
    },
  };
}
