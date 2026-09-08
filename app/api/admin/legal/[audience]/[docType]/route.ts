import { NextResponse } from "next/server";

import { type LegalDocType } from "@/lib/admin/legal-preview";
import { readLegalMarkdown, writeLegalMarkdown } from "@/lib/site/legal-server";
import type { LegalAudience } from "@/lib/site/legal-content";

const EDITABLE_DOC_TYPES = new Set<LegalDocType>(["cgv", "mentions", "confidentialite"]);

function parseAudience(value: string): LegalAudience | null {
  if (value === "agence" || value === "entreprise" || value === "comptable") {
    return value;
  }
  return null;
}

function parseDocType(value: string): LegalDocType | null {
  if (EDITABLE_DOC_TYPES.has(value as LegalDocType)) {
    return value as LegalDocType;
  }
  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ audience: string; docType: string }> },
) {
  const { audience: rawAudience, docType: rawDocType } = await context.params;
  const audience = parseAudience(rawAudience);
  const docType = parseDocType(rawDocType);

  if (!audience || !docType) {
    return NextResponse.json({ error: "Invalid audience or document type" }, { status: 400 });
  }

  try {
    const markdown = readLegalMarkdown(docType, audience);
    return NextResponse.json({ markdown, docType, audience });
  } catch {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ audience: string; docType: string }> },
) {
  const { audience: rawAudience, docType: rawDocType } = await context.params;
  const audience = parseAudience(rawAudience);
  const docType = parseDocType(rawDocType);

  if (!audience || !docType) {
    return NextResponse.json({ error: "Invalid audience or document type" }, { status: 400 });
  }

  const body = (await request.json()) as { markdown?: string };
  if (typeof body.markdown !== "string") {
    return NextResponse.json({ error: "markdown is required" }, { status: 400 });
  }

  try {
    const markdown = writeLegalMarkdown(docType, audience, body.markdown);
    return NextResponse.json({ markdown, docType, audience });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Write failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
