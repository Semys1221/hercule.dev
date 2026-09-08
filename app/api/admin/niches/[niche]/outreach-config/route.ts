import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getOutreachConfigView,
  upsertOutreachConfig,
} from "@/lib/admin/niches/outreach-config";
import { isNiche } from "@/lib/admin/navigation";

const patchSchema = z.object({
  instantly_campaign_id: z.string().uuid(),
  calendly_event_type_uri: z.string().trim().nullable().optional(),
  updated_by: z.string().trim().min(1).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ niche: string }> },
) {
  const { niche: rawNiche } = await context.params;
  if (!isNiche(rawNiche)) {
    return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
  }

  try {
    const config = await getOutreachConfigView(rawNiche);
    return NextResponse.json({ config });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ niche: string }> },
) {
  const { niche: rawNiche } = await context.params;
  if (!isNiche(rawNiche)) {
    return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
  }

  const body = (await request.json()) as unknown;
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const row = await upsertOutreachConfig(rawNiche, parsed.data);
    const config = await getOutreachConfigView(rawNiche);
    return NextResponse.json({ row, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
