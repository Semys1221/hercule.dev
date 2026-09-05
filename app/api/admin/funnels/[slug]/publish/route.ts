import { NextResponse } from "next/server";

import { verifyAdminRequest } from "@/lib/admin/auth";
import { publishFunnel } from "@/lib/admin/funnels/repo";
import { listFunnelsQuerySchema, type FunnelScope } from "@/lib/admin/funnels/schema";

function scopeFromQuery(params: URLSearchParams): FunnelScope | NextResponse {
  const parsed = listFunnelsQuerySchema.safeParse({
    audience: params.get("audience"),
    kind: params.get("kind"),
    stage: params.get("stage") || null,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { audience, kind, stage } = parsed.data;
  if (kind === "vente" && !stage) {
    return NextResponse.json({ error: "stage is required for vente funnels" }, { status: 400 });
  }

  return {
    audience,
    kind,
    stage: kind === "onboarding" ? null : (stage ?? null),
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const scope = scopeFromQuery(new URL(request.url).searchParams);
  if (scope instanceof NextResponse) {
    return scope;
  }

  try {
    const funnel = await publishFunnel(scope, slug);
    return NextResponse.json({ funnel });
  } catch {
    return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
  }
}
