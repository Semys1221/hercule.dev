import { NextResponse } from "next/server";

import {
  appointmentActionHttpStatus,
  reportAppointmentNoshow,
} from "@/lib/clients/appointments/actions";

type RouteParams = {
  params: Promise<{ slug: string; id: string }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  const { slug, id } = await params;
  try {
    const result = await reportAppointmentNoshow({
      slug: slug.trim(),
      appointmentId: id.trim(),
    });
    return NextResponse.json({ ok: true, status: result.appointment.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No-show failed";
    console.error("[api/clients/appointments/noshow]", message);
    return NextResponse.json(
      { error: message },
      { status: appointmentActionHttpStatus(error) },
    );
  }
}
