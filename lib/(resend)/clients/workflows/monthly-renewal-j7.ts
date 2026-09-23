import type { SupabaseClient } from "@supabase/supabase-js";

import { sendBookingEmail } from "@/lib/(resend)/communication/send";
import { isCheckoutPlaceholderEmail } from "@/lib/clients/ops";
import { renderNotification } from "@/lib/(resend)/notifications/file-io";
import {
  MONTHLY_RENEWAL_CTA_CONTINUE,
  MONTHLY_RENEWAL_CTA_PAUSE,
  MONTHLY_RENEWAL_J7_SENT_AT_KEY,
  eliteOptionBody,
  hasSentMonthlyRenewalJ7Email,
  standardOptionBody,
} from "@/lib/clients/monthly-renewal-announcement";
import { buildClientDashboardUrl } from "@/lib/clients/supabase";
import type { ClientRow } from "@/lib/clients/types";

export function monthlyRenewalDashboardUrl(slug: string): string {
  const url = new URL(buildClientDashboardUrl(slug));
  url.searchParams.set("renewal", "1");
  return url.toString();
}

export async function sendMonthlyRenewalJ7Email(params: {
  db: SupabaseClient;
  client: ClientRow;
  rdvRemaining: number;
  volumeEndLabel: string;
}): Promise<"sent" | "skipped"> {
  if (hasSentMonthlyRenewalJ7Email(params.client.profile)) {
    return "skipped";
  }
  if (isCheckoutPlaceholderEmail(params.client.email)) {
    return "skipped";
  }

  const rendered = renderNotification("monthly-renewal-j7", {
    greeting: params.client.first_name?.trim()
      ? `Bonjour ${params.client.first_name.trim()},`
      : "Bonjour,",
    standardBody: standardOptionBody({
      rdvRemaining: params.rdvRemaining,
      volumeEndLabel: params.volumeEndLabel,
    }),
    ctaPause: MONTHLY_RENEWAL_CTA_PAUSE,
    eliteBody: eliteOptionBody(),
    ctaContinue: MONTHLY_RENEWAL_CTA_CONTINUE,
    dashboardUrl: monthlyRenewalDashboardUrl(params.client.slug),
  });
  const result = await sendBookingEmail({
    to: params.client.email,
    subject: rendered.subject,
    text: rendered.text,
    idempotencyKey: `monthly-renewal-j7:${params.client.id}`,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  const profile = {
    ...(params.client.profile ?? {}),
    [MONTHLY_RENEWAL_J7_SENT_AT_KEY]: new Date().toISOString(),
  };
  const { error } = await params.db
    .from("clients")
    .update({ profile })
    .eq("id", params.client.id);

  if (error) {
    throw new Error(error.message);
  }

  return "sent";
}
