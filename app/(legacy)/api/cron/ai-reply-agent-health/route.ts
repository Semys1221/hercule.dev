import { NextResponse } from "next/server";

import {
  checkAiReplyAgentHealth,
  notifyOpsAiReplyHealthAlert,
} from "@/lib/legacy/ai-reply-agent/health";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return false;
  }
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${cronSecret}`) return true;
  return request.headers.get("x-cron-secret") === cronSecret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await checkAiReplyAgentHealth();
    const notified = await notifyOpsAiReplyHealthAlert(report);
    return NextResponse.json({ ok: true, notified, ...report });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/ai-reply-agent-health]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = GET;
