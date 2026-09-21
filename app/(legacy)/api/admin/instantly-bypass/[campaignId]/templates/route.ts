import { NextResponse } from "next/server";
import { z } from "zod";

import { syncBypassSequenceToFile } from "@/lib/legacy/legal-documentation/sync-sequences";
import { listAllTemplates, saveTemplate } from "@/lib/legacy/instantly-bypass/templates";
import type { BypassTemplateKey } from "@/lib/legacy/instantly-bypass/types";

const templateKeySchema = z.enum([
  "interested_email1",
  "interested_email2",
  "interested_email3",
  "no_show_email1",
  "no_show_email2",
]);

const putBodySchema = z.object({
  templates: z.array(
    z.object({
      template_key: templateKeySchema,
      subject: z.string(),
      body_html: z.string(),
    }),
  ),
  sequence_slug: z.string().min(1).optional(),
  sequence_niche: z.enum(["agence", "comptable", "entreprise", "cif"]).optional(),
  sequence_step_meta: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        delay: z.string(),
        template_key: templateKeySchema,
      }),
    )
    .optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  const { campaignId } = await context.params;
  if (!campaignId.trim()) {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });
  }

  try {
    const templates = await listAllTemplates(campaignId);
    return NextResponse.json({ campaignId, templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  const { campaignId } = await context.params;
  if (!campaignId.trim()) {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });
  }

  const parsed = putBodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    if (
      parsed.data.sequence_slug &&
      parsed.data.sequence_niche &&
      parsed.data.sequence_step_meta?.length
    ) {
      syncBypassSequenceToFile({
        niche: parsed.data.sequence_niche,
        slug: parsed.data.sequence_slug,
        campaignId,
        templateKeys: parsed.data.sequence_step_meta.map((step) => step.template_key),
        stepMeta: parsed.data.sequence_step_meta.map((step) => ({
          id: step.id,
          label: step.label,
          delay: step.delay,
          templateKey: step.template_key,
        })),
        templates: parsed.data.templates,
      });
    }

    for (const template of parsed.data.templates) {
      await saveTemplate(
        campaignId,
        template.template_key as BypassTemplateKey,
        template.subject,
        template.body_html,
      );
    }
    const templates = await listAllTemplates(campaignId);
    return NextResponse.json({ ok: true, campaignId, templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
