import { NextResponse } from "next/server";
import { z } from "zod";

import { bookingSequenceTypesFor, getEmailSequence } from "@/lib/admin/email-sequences/registry";
import { listSequenceHistory } from "@/lib/admin/sequences/sequence-history";
import { isNiche } from "@/lib/admin/navigation";

const querySchema = z.object({
  niche: z.enum(["agence", "comptable", "entreprise"]),
  days: z.coerce.number().int().min(1).max(90).optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const sequence = getEmailSequence(slug);
  if (!sequence) {
    return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    niche: searchParams.get("niche"),
    days: searchParams.get("days") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  if (!isNiche(parsed.data.niche)) {
    return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
  }

  try {
    const provider = sequence.provider === "instantly" ? "instantly" : "resend";
    const jobs = await listSequenceHistory({
      slug,
      niche: parsed.data.niche,
      provider,
      emailTypes: bookingSequenceTypesFor(slug, parsed.data.niche),
      templateKeys: sequence.bypassTemplateKeys,
      days: parsed.data.days ?? 30,
    });
    return NextResponse.json({ jobs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "History load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
