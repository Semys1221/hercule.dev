import { NextResponse } from "next/server";

import { verifyAdminRequest } from "@/lib/admin/auth";
import { readFaqDocument, writeFaqDocument } from "@/lib/site/faq-server";
import { faqAudienceSchema, faqDocumentSchema } from "@/lib/site/faq-types";

function parseAudience(value: string) {
  const parsed = faqAudienceSchema.safeParse(value);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ audience: string }> },
) {
  if (!verifyAdminRequest(_request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { audience: rawAudience } = await context.params;
  const audience = parseAudience(rawAudience);
  if (!audience) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
  }

  try {
    const document = readFaqDocument(audience);
    return NextResponse.json({ document });
  } catch {
    return NextResponse.json({ error: "FAQ document not found" }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ audience: string }> },
) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { audience: rawAudience } = await context.params;
  const audience = parseAudience(rawAudience);
  if (!audience) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
  }

  const body = (await request.json()) as unknown;
  const parsed = faqDocumentSchema.safeParse({
    ...(typeof body === "object" && body !== null ? body : {}),
    schemaVersion: 1,
    audience,
    updatedAt: new Date().toISOString(),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const document = writeFaqDocument(parsed.data);
    return NextResponse.json({ document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Write failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
