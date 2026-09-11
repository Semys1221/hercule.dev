import { NextResponse } from "next/server";
import { z } from "zod";

import { syncComptableCheckoutSession } from "@/lib/payments/sync-comptable-checkout";

const bodySchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const result = await syncComptableCheckoutSession(parsed.data.sessionId);

    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "454528",
      },
      body: JSON.stringify({
        sessionId: "454528",
        runId: "post-payment-sync",
        hypothesisId: "A,B",
        location: "sync-comptable-checkout/route.ts",
        message: "comptable checkout sync result",
        data: {
          sessionIdPrefix: parsed.data.sessionId.slice(0, 12),
          synced: result.synced,
          reason: result.reason ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "sync failed";
    console.error("[payments/sync-comptable-checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
