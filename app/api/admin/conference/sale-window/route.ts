import { NextResponse } from "next/server";
import { z } from "zod";

import {
  setConferenceRegistrationPhase,
  getPublicConferenceSaleWindow,
} from "@/lib/conference/sale-window-store";
import { toPublicSaleWindow } from "@/lib/conference/sale-window";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  phase: z.enum(["waiting", "open", "closed"]),
});

export async function GET() {
  try {
    const window = await getPublicConferenceSaleWindow();
    return NextResponse.json(window);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load sale window";
    console.error("[api/admin/conference/sale-window]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const row = await setConferenceRegistrationPhase(parsed.data.phase);
    return NextResponse.json(toPublicSaleWindow(row));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to set registration phase";
    console.error("[api/admin/conference/sale-window]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
