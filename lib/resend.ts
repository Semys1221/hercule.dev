import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient(): Resend {
  if (client) return client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }
  client = new Resend(apiKey);
  return client;
}

export type SendEmailSuccess = { ok: true; id: string };
export type SendEmailFailure = {
  ok: false;
  error: string;
  statusCode?: number;
};
export type SendEmailResult = SendEmailSuccess | SendEmailFailure;
