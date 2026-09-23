import { NextResponse } from "next/server";
import { z } from "zod";

import { getNotificationCatalogEntry } from "@/lib/(resend)/notifications/catalog";
import { readNotification, writeNotification } from "@/lib/(resend)/notifications/file-io";

const putSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const entry = getNotificationCatalogEntry(id);
  if (!entry) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }
  try {
    const document = readNotification(id);
    return NextResponse.json({ entry, document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!getNotificationCatalogEntry(id)) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }
  const parsed = putSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  writeNotification({ id, subject: parsed.data.subject, body: parsed.data.body });
  return NextResponse.json({ ok: true });
}
