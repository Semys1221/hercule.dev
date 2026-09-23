import { NextResponse } from "next/server";
import { z } from "zod";

import { syncDecTrialCheckoutSession } from "@/lib/legacy/payments/dec-trial-checkout-session";
import { syncConferenceCheckoutSession } from "@/lib/legacy/payments/sync-conference-checkout";

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
    const conferenceResult = await syncConferenceCheckoutSession(parsed.data.sessionId);
    if (conferenceResult.synced) {
      return NextResponse.json(conferenceResult);
    }
    const decTrialResult = await syncDecTrialCheckoutSession(parsed.data.sessionId);
    return NextResponse.json(decTrialResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : "sync failed";
    console.error("[payments/sync-conference-checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
