import { getResendClient } from "@/lib/resend";

import { getBookingFromAddress } from "./templates";

export type SendBookingEmailSuccess = {
  ok: true;
  id: string;
  messageId: string | null;
};

export type SendBookingEmailFailure = {
  ok: false;
  error: string;
  statusCode?: number;
};

export type SendBookingEmailResult =
  | SendBookingEmailSuccess
  | SendBookingEmailFailure;

export async function sendBookingEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  idempotencyKey: string;
  headers?: Record<string, string>;
}): Promise<SendBookingEmailResult> {
  const resend = getResendClient();
  const { data, error } = await resend.emails.send(
    {
      from: getBookingFromAddress(),
      to: [params.to],
      subject: params.subject,
      text: params.text,
      ...(params.html ? { html: params.html } : {}),
      ...(params.headers ? { headers: params.headers } : {}),
    },
    { idempotencyKey: params.idempotencyKey },
  );

  if (error) {
    console.error("[booking-communication] Resend failed:", error.message);
    return {
      ok: false,
      error: error.message,
      statusCode: "statusCode" in error ? Number(error.statusCode) : undefined,
    };
  }

  if (!data?.id) {
    return { ok: false, error: "Resend returned no email id" };
  }

  let messageId: string | null = null;
  try {
    const retrieved = await resend.emails.get(data.id);
    messageId = retrieved.data?.message_id?.trim() || null;
  } catch (err) {
    console.warn(
      "[booking-communication] Could not fetch Resend message_id:",
      err instanceof Error ? err.message : err,
    );
  }

  return { ok: true, id: data.id, messageId };
}

/** @deprecated Use sendBookingEmail */
export const sendBookingPlainText = sendBookingEmail;
