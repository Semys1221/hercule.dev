import type { SequenceEditorAdapter, SequenceStep } from "../types";

type ReplyAgentAdapterOptions = {
  campaignId: string;
};

export function createReplyAgentAdapter(
  options: ReplyAgentAdapterOptions,
): SequenceEditorAdapter {
  const { campaignId } = options;

  return {
    variables: ["@PRENOM", "@TYPE_DEMANDE", "@ZONE", "@CALENDRIER", "@SIGNATURE"],
    async load() {
      const response = await fetch(`/api/admin/ai-reply-agent/${campaignId}`);
      const body = (await response.json()) as {
        config?: { prompt_snapshot?: string; niche_preset_id?: string; target_type?: string };
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Chargement impossible");
      }
      const prompt = body.config?.prompt_snapshot ?? "";
      return [
        {
          id: "prompt",
          label: "Prompt",
          delay: "—",
          subject: body.config?.niche_preset_id
            ? `${body.config.niche_preset_id} (${body.config.target_type ?? "—"})`
            : "Prompt",
          body: prompt,
          bodyFormat: "text",
        },
      ];
    },
    async save(steps: SequenceStep[]) {
      const prompt = steps[0]?.body ?? "";
      const response = await fetch(`/api/admin/ai-reply-agent/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt_snapshot: prompt }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Enregistrement impossible");
      }
    },
  };
}
