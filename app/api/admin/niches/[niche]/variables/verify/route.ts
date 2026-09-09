import { NextResponse } from "next/server";
import { z } from "zod";

import { isNiche } from "@/lib/admin/navigation";
import { verifyEmailVariablesForNiche } from "@/lib/admin/niches/verify-email-variables";

const bodySchema = z
  .object({
    maxLeads: z.number().int().min(1).max(2000).optional(),
  })
  .optional();

export async function POST(
  request: Request,
  context: { params: Promise<{ niche: string }> },
) {
  const { niche: rawNiche } = await context.params;
  if (!isNiche(rawNiche)) {
    return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
  }

  let maxLeads: number | undefined;
  try {
    const json = await request.json().catch(() => undefined);
    const parsed = bodySchema.safeParse(json);
    if (parsed.success && parsed.data?.maxLeads) {
      maxLeads = parsed.data.maxLeads;
    }
  } catch {
    // empty body is fine
  }

  try {
    const result = await verifyEmailVariablesForNiche(rawNiche, { maxLeads });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verify failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
