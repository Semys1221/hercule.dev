import { NextResponse } from "next/server";

import { getCalendlyBaseUrl } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    calendlyBaseUrl: getCalendlyBaseUrl(),
  });
}
