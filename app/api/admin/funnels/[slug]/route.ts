import { NextResponse } from "next/server";

import { verifyAdminRequest } from "@/lib/admin/auth";
import {
  readFunnel,
  updateFunnel,
  deleteFunnel,
} from "@/lib/admin/funnels/repo";
import {
  funnelDocumentSchema,
  listFunnelsQuerySchema,
  patchFunnelBodySchema,
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

export async function GET(
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
    const funnel = await readFunnel(scope, slug);
    return NextResponse.json({ funnel });
  } catch {
    return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
  }
}

export async function PATCH(
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

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchFunnelBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const existing = await readFunnel(scope, slug);
    const merged = funnelDocumentSchema.parse({
      ...existing,
      ...parsed.data,
      schemaVersion: 1,
      slug: existing.slug,
      audience: existing.audience,
      kind: existing.kind,
      stage: existing.stage,
      publicPath: existing.publicPath,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    });

    const funnel = await updateFunnel(scope, slug, {
      displayName: merged.displayName,
      layoutId: merged.layoutId,
      steps: merged.steps,
      status: merged.status,
    });

    return NextResponse.json({ funnel });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
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
    await deleteFunnel(scope, slug);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
  }
}
