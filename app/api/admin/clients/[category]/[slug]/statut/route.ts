import { NextResponse } from "next/server";

import { isProductStatut } from "@/lib/admin/clients/types";
import { isAudience } from "@/lib/admin/navigation";
import {
  createLinkTrackingClient,
  findLeadByLink,
} from "@/lib/link-tracking/supabase";

type RouteParams = {
  params: Promise<{ category: string; slug: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { category, slug } = await params;
  if (!isAudience(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  let body: { statut?: unknown };
  try {
    body = (await request.json()) as { statut?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.statut !== "string" || !isProductStatut(body.statut)) {
    return NextResponse.json({ error: "Invalid product_statut" }, { status: 400 });
  }

  try {
    const client = createLinkTrackingClient();
    const lookup = await findLeadByLink(client, slug.trim());
    if (!lookup || lookup.category !== category) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { error } = await client
      .from(category)
      .update({ product_statut: body.statut })
      .eq("id", lookup.lead.id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true, productStatut: body.statut });
  } catch (error) {
    const message = error instanceof Error ? error.message : "statut update failed";
    console.error("[admin/clients/statut]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
