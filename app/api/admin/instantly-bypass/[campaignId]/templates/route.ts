import { NextResponse } from "next/server";
import { z } from "zod";

import { listAllTemplates, saveTemplate } from "@/lib/instantly-bypass/templates";
import type { BypassTemplateKey } from "@/lib/instantly-bypass/types";

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
