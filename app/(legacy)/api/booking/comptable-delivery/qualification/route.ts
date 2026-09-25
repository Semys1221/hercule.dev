import { NextResponse } from "next/server";

import { funnelRouteSegmentSchema } from "@/lib/booking/comptable-delivery-funnel/schema";
import {
  getQualificationBySlug,
  upsertQualificationFromPayload,
} from "@/lib/legacy/booking/comptable-delivery-qualification";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim();
  const routeSegmentRaw = url.searchParams.get("routeSegment")?.trim();

  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const routeParsed = funnelRouteSegmentSchema.safeParse(routeSegmentRaw);
  if (!routeParsed.success) {
    return NextResponse.json({ error: "routeSegment required" }, { status: 400 });
  }

  try {
    const record = await getQualificationBySlug(slug, routeParsed.data);
    if (!record) {
      return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, record });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[booking/comptable-delivery/qualification GET]", message);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const record = await upsertQualificationFromPayload(
      body as Parameters<typeof upsertQualificationFromPayload>[0],
    );
    if (!record) {
      return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, record });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[booking/comptable-delivery/qualification POST]", message);
    return NextResponse.json({ error: "invalid_payload", detail: message }, { status: 400 });
  }
}
