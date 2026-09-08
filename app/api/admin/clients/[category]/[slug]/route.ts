import { NextResponse } from "next/server";

import { loadClientCockpit } from "@/lib/admin/clients/load-cockpit";
import { deleteSeedClient, isSeedSlug } from "@/lib/admin/clients/seed";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";
import { isLeadCategory } from "@/lib/admin/navigation";

type RouteParams = {
  params: Promise<{ category: string; slug: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { category, slug } = await params;
  if (!isLeadCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  try {
    const data = await loadClientCockpit(category, slug);
    if (!data) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "client fetch failed";
    console.error("[admin/clients/slug]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { category, slug } = await params;
  if (!isLeadCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (!isSeedSlug(slug)) {
    return NextResponse.json(
      { error: "Only demo clients (seed-*) can be deleted" },
      { status: 403 },
    );
  }

  try {
    const client = createLinkTrackingClient();
    await deleteSeedClient(client, category as LeadCategory, slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "delete failed";
    console.error("[admin/clients/slug DELETE]", message);
    const status = message === "Client not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
