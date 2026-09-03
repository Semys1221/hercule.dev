import { getResendClient, type SendEmailResult } from "@/lib/resend";

import { getBookingFromAddress } from "./templates";

export async function sendBookingPlainText(params: {
  to: string;
  subject: string;
  text: string;
  idempotencyKey: string;
}): Promise<SendEmailResult> {
  const resend = getResendClient();
  const { data, error } = await resend.emails.send(
    {
      from: getBookingFromAddress(),
      to: [params.to],
      subject: params.subject,
      text: params.text,
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

  return { ok: true, id: data.id };
}
