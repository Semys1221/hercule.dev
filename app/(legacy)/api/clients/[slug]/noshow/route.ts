import { NextResponse } from "next/server";

import { createClientsClient } from "@/lib/clients/supabase";
import { reportClientNoshow } from "@/lib/clients/workflows/report-noshow";
import { getBookingFromAddress } from "@/lib/legacy/booking-communication/templates";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      message?: unknown;
    };
    const message = typeof body.message === "string" ? body.message : "";

    const result = await reportClientNoshow({
      supabase: createClientsClient(),
      slug: normalizedSlug,
      message,
    });

    return NextResponse.json({
      ok: true,
      from: getBookingFromAddress(),
      rdvUsed: result.rdvUsed,
      rdvTotal: result.rdvTotal,
      refunded: result.refunded,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No-show notification failed";
    const status =
      message === "Client not found"
        ? 404
        : message.includes("caractères")
          ? 400
          : 500;
    console.error("[api/clients/slug/noshow]", message);
    return NextResponse.json({ error: message }, { status });
  }
}
