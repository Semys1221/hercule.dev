import { sendBookingEmail } from "@/lib/booking-communication/send";
import type { Niche } from "@/lib/admin/navigation";

export async function sendReplyAgentTestEmail(params: {
  niche: Niche;
  campaignId: string;
  recipientEmail: string;
  promptSnapshot?: string;
}): Promise<{ ok: true; resendEmailId: string; subject: string }> {
  const recipient = params.recipientEmail.trim().toLowerCase();
  if (!recipient) {
    throw new Error("recipient_email_required");
  }

  const prompt = params.promptSnapshot?.trim() || "(prompt vide)";
  const subject = `[Test reply agent] ${params.niche} — ${params.campaignId.slice(0, 8)}`;
  const text = [
    "Aperçu du prompt reply agent (envoi test ops — aucun lead Instantly touché).",
    "",
    prompt,
  ].join("\n");

  const idempotencyKey = `reply-agent-test:${params.campaignId}:${recipient}:${Date.now()}`;
  const result = await sendBookingEmail({
    to: recipient,
    subject,
    text,
    idempotencyKey,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  return {
    ok: true,
    resendEmailId: result.id,
    subject,
  };
}
