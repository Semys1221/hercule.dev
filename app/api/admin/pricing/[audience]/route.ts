import { NextResponse } from "next/server";

import { verifyAdminRequest } from "@/lib/admin/auth";
import { readPricingDocument, writePricingDocument } from "@/lib/site/pricing-server";
import { pricingDocumentSchema } from "@/lib/site/pricing-types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ audience: string }> },
) {
  if (!verifyAdminRequest(_request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { audience } = await context.params;
  if (audience !== "agence") {
    return NextResponse.json({ error: "Pricing is only available for agence" }, { status: 400 });
  }

  try {
    const document = readPricingDocument("agence");
    return NextResponse.json({ document });
  } catch {
    return NextResponse.json({ error: "Pricing document not found" }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ audience: string }> },
) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { audience } = await context.params;
  if (audience !== "agence") {
    return NextResponse.json({ error: "Pricing is only available for agence" }, { status: 400 });
  }

  const body = (await request.json()) as unknown;
  const parsed = pricingDocumentSchema.safeParse({
    ...(typeof body === "object" && body !== null ? body : {}),
    schemaVersion: 1,
    audience: "agence",
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
