import { DEFAULT_BOOKING_EMAIL_TEMPLATES } from "@/lib/booking-communication/templates";
import type { BookingEmailType } from "@/lib/booking-communication/types";

const RESEND_API = "https://api.resend.com";

type ResendEmailListItem = {
  id: string;
  to: string[];
  subject: string;
  created_at: string;
};

export async function listRecentResendEmails(limit = 50): Promise<ResendEmailListItem[]> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const response = await fetch(`${RESEND_API}/emails?limit=${limit}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend list emails failed: ${response.status} ${body}`);
  }

  const json = (await response.json()) as { data?: ResendEmailListItem[] };
  return json.data ?? [];
}

export async function assertResendEmailSent(
  recipient: string,
  emailTypes: BookingEmailType[],
  sinceMs = 10 * 60 * 1000,
): Promise<void> {
  const since = Date.now() - sinceMs;
  const emails = await listRecentResendEmails(100);
  const normalizedRecipient = recipient.trim().toLowerCase();

  for (const emailType of emailTypes) {
    const expectedSubject = DEFAULT_BOOKING_EMAIL_TEMPLATES[emailType]?.subject;
    if (!expectedSubject) {
      throw new Error(`No default subject for ${emailType}`);
    }

    const found = emails.some((email) => {
      const createdAt = new Date(email.created_at).getTime();
      const toMatch = email.to.some((to) => to.toLowerCase() === normalizedRecipient);
      const subjectMatch =
        email.subject === expectedSubject || email.subject.includes(expectedSubject.slice(0, 20));
      return toMatch && subjectMatch && createdAt >= since;
    });

    if (!found) {
      const recent = emails
        .filter((email) => email.to.some((to) => to.toLowerCase() === normalizedRecipient))
        .map((email) => email.subject)
        .slice(0, 10);
      throw new Error(
        `Resend email for ${emailType} (${expectedSubject}) not found for ${recipient}. Recent: ${recent.join(" | ") || "none"}`,
      );
    }
  }
}
