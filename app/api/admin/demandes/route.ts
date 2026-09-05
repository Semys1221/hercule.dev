import { NextResponse } from "next/server";

import { listAllDemandesCards, updateDemandeCard } from "@/lib/admin/demandes";

export async function GET() {
  try {
    const cards = await listAllDemandesCards();
    return NextResponse.json({ cards });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let body: { external_id?: string; fields?: Record<string, unknown> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.external_id || !body.fields || typeof body.fields !== "object") {
    return NextResponse.json(
      { error: "external_id and fields required" },
      { status: 400 },
    );
  }

  try {
    const card = await updateDemandeCard(body.external_id, body.fields);
    return NextResponse.json({ card });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Card not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
