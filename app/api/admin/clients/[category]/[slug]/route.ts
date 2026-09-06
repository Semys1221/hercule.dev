import { NextResponse } from "next/server";

import { loadClientCockpit } from "@/lib/admin/clients/load-cockpit";
import { isAudience } from "@/lib/admin/navigation";

type RouteParams = {
  params: Promise<{ category: string; slug: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { category, slug } = await params;
  if (!isAudience(category)) {
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
