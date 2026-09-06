import { NextResponse } from "next/server";

import {
  readSalesSessionSettings,
  writeSalesSessionSettings,
} from "@/lib/admin/funnels/sales-session-settings-server";
import { salesSessionSettingsDocumentSchema } from "@/lib/admin/funnels/sales-session-settings-types";
import { isAudience } from "@/lib/admin/navigation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ audience: string }> },
) {
  const { audience: rawAudience } = await context.params;
  if (!isAudience(rawAudience)) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
  }

  try {
    const document = readSalesSessionSettings(rawAudience);
    return NextResponse.json({ document });
  } catch {
    return NextResponse.json({ error: "Session settings not found" }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ audience: string }> },
) {
  const { audience: rawAudience } = await context.params;
  if (!isAudience(rawAudience)) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
  }

  const body = (await request.json()) as unknown;
  const parsed = salesSessionSettingsDocumentSchema.safeParse({
    ...(typeof body === "object" && body !== null ? body : {}),
    schemaVersion: 1,
    audience: rawAudience,
    updatedAt: new Date().toISOString(),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const document = writeSalesSessionSettings(parsed.data);
    return NextResponse.json({ document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Write failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
