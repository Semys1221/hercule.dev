import { NextResponse } from "next/server";

import { createClientsClient } from "@/lib/clients/supabase";
import { reportClientNoshow } from "@/lib/(resend)/clients/workflows/report-noshow";
import { getBookingFromAddress } from "@/lib/(resend)/communication/templates";

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
      appointmentId?: unknown;
    };
    const appointmentId =
      typeof body.appointmentId === "string" ? body.appointmentId : "";

    const result = await reportClientNoshow({
      supabase: createClientsClient(),
      slug: normalizedSlug,
      appointmentId,
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
        : message.includes("required") || message.includes("introuvable")
          ? 400
          : 500;
    console.error("[api/clients/slug/noshow]", message);
    return NextResponse.json({ error: message }, { status });
  }
}
