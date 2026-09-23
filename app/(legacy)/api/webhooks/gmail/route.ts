import { NextResponse } from "next/server";

import { runClientInboxSync } from "@/lib/engin/client-inbox/run-sync";

type PubSubPushBody = {
  message?: {
    data?: string;
    messageId?: string;
  };
  subscription?: string;
};

function isPushAuthorized(request: Request): boolean {
  const secret = process.env.GMAIL_PUBSUB_PUSH_SECRET?.trim();
  if (!secret) {
    return true;
  }
  return request.headers.get("x-gmail-push-secret") === secret;
}

export async function POST(request: Request) {
  if (!isPushAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PubSubPushBody;
  try {
    body = (await request.json()) as PubSubPushBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.message?.data) {
    try {
      const decoded = Buffer.from(body.message.data, "base64").toString("utf8");
      const payload = JSON.parse(decoded) as { emailAddress?: string; historyId?: string };
      console.info("[webhooks/gmail] push", payload.emailAddress, payload.historyId);
    } catch {
      // Non-fatal — still run sync
    }
  }

  try {
    const result = await runClientInboxSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[webhooks/gmail]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
