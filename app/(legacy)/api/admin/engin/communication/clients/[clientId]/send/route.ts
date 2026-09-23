import { NextResponse } from "next/server";
import { z } from "zod";

import { createClientsClient } from "@/lib/clients/supabase";
import { sendClientInboxMessage } from "@/lib/engin/client-inbox/send-reply";

const bodySchema = z.object({
  body: z.string().min(1),
  subject: z.string().optional(),
  threadId: z.string().uuid().optional(),
  replyToMessageId: z.string().uuid().optional(),
});

type Params = { params: Promise<{ clientId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { clientId } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const client = createClientsClient();
    const result = await sendClientInboxMessage(client, {
      clientId,
      body: parsed.data.body,
      subject: parsed.data.subject,
      threadId: parsed.data.threadId,
      replyToMessageId: parsed.data.replyToMessageId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    console.error("[api/admin/engin/communication/clients/send]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
