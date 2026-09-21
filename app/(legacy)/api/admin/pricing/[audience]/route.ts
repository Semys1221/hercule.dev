import { NextResponse } from "next/server";

import { readPricingDocument, writePricingDocument } from "@/lib/site/pricing-server";
import { pricingAudienceSchema, pricingDocumentSchema } from "@/lib/site/pricing-types";

function parsePricingAudience(value: string) {
  const parsed = pricingAudienceSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ audience: string }> },
) {
  const { audience: rawAudience } = await context.params;
  const audience = parsePricingAudience(rawAudience);
  if (!audience) {
    return NextResponse.json({ error: "Invalid pricing audience" }, { status: 400 });
  }

  try {
    const document = readPricingDocument(audience);
    return NextResponse.json({ document });
  } catch {
    return NextResponse.json({ error: "Pricing document not found" }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ audience: string }> },
) {
  const { audience: rawAudience } = await context.params;
  const audience = parsePricingAudience(rawAudience);
  if (!audience) {
    return NextResponse.json({ error: "Invalid pricing audience" }, { status: 400 });
  }

  const body = (await request.json()) as unknown;
  const parsed = pricingDocumentSchema.safeParse({
    ...(typeof body === "object" && body !== null ? body : {}),
    schemaVersion: 1,
    audience,
    updatedAt: new Date().toISOString(),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const document = writePricingDocument(parsed.data);
    return NextResponse.json({ document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Write failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
