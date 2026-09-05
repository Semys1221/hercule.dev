import { NextResponse } from "next/server";

import { verifyAdminRequest } from "@/lib/admin/auth";
import { getPresetsCatalog } from "@/lib/admin/funnels/catalog";
import {
  createFunnel,
  listFunnels,
} from "@/lib/admin/funnels/repo";
import {
  createFunnelBodySchema,
  listFunnelsQuerySchema,
  type FunnelScope,
} from "@/lib/admin/funnels/schema";

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

export async function GET(request: Request) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = scopeFromQuery(new URL(request.url).searchParams);
  if (scope instanceof NextResponse) {
    return scope;
  }

  try {
    const funnels = await listFunnels(scope);
    return NextResponse.json({ funnels, scope });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createFunnelBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { audience, kind, stage, displayName } = parsed.data;
  if (kind === "vente" && !stage) {
    return NextResponse.json({ error: "stage is required for vente funnels" }, { status: 400 });
  }

  const scope: FunnelScope = {
    audience,
    kind,
    stage: kind === "onboarding" ? null : (stage ?? null),
  };

  try {
    const funnel = await createFunnel(scope, displayName);
    return NextResponse.json({ funnel }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
