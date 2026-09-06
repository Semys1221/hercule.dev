import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createLinkTrackingClient,
  findLeadById,
} from "@/lib/link-tracking/supabase";
import { dashboardLinkFor } from "@/lib/link-tracking/urls";
import type { LeadCategory } from "@/lib/link-tracking/types";

const querySchema = z.object({
  category: z.enum(["agence", "entreprise"]),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    category: searchParams.get("category") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  try {
    const client = createLinkTrackingClient();
    const lead = await findLeadById(
      client,
      parsed.data.category as LeadCategory,
      id,
    );

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({
      category: parsed.data.category,
      lead: {
        ...lead,
        dashboard_link: dashboardLinkFor(lead),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lead fetch failed";
    console.error("[admin/leads]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
