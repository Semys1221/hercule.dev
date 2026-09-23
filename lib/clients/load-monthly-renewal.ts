import type { SupabaseClient } from "@supabase/supabase-js";

import {
  renewalPromptStatus,
  type RenewalPromptStatus,
} from "./monthly-renewal-announcement";
import { countSucceededSubscriptionPayments } from "./monthly-renewal-choice";
import { getSubscriptionPeriodEnd } from "./stripe-subscription-period";
import type { ClientRow } from "./types";

export async function evaluateClientRenewalPrompt(
  db: SupabaseClient,
  row: ClientRow,
  now = new Date(),
): Promise<{ status: RenewalPromptStatus; periodEnd: Date | null }> {
  if (row.renewal_choice || row.renewal_prompt_closed_at) {
    return { status: "closed", periodEnd: null };
  }

  const subscriptionId = row.stripe_subscription_id?.trim() ?? "";
  if (!subscriptionId) {
    return {
      status: renewalPromptStatus({
        client: row,
        succeededSubscriptionPaymentCount: 0,
        periodEnd: null,
        now,
      }),
      periodEnd: null,
    };
  }

  const paymentCount = await countSucceededSubscriptionPayments(db, row.id, subscriptionId);
  let periodEnd: Date | null = null;
  if (paymentCount === 1) {
    try {
      periodEnd = await getSubscriptionPeriodEnd(subscriptionId);
    } catch (error) {
      console.error(
        "[monthly-renewal] stripe period end failed:",
        error instanceof Error ? error.message : error,
      );
      return { status: "hidden", periodEnd: null };
    }
  }

  return {
    status: renewalPromptStatus({
      client: row,
      succeededSubscriptionPaymentCount: paymentCount,
      periodEnd,
      now,
    }),
    periodEnd,
  };
}
