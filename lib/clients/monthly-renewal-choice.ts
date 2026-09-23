import type { SupabaseClient } from "@supabase/supabase-js";

import { pauseStripeSubscription } from "./stripe-subscription-period";
import {
  isRenewalChoice,
  stripeUpdateForRenewalChoice,
  type RenewalChoice,
} from "./monthly-renewal-announcement";
import type { ClientRow } from "./types";

export async function countSucceededSubscriptionPayments(
  client: SupabaseClient,
  clientId: string,
  stripeSubscriptionId: string,
): Promise<number> {
  const { count, error } = await client
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .eq("status", "succeeded");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function closeRenewalPrompt(
  client: SupabaseClient,
  clientId: string,
  closedAt = new Date(),
): Promise<boolean> {
  const { data, error } = await client
    .from("clients")
    .update({ renewal_prompt_closed_at: closedAt.toISOString() })
    .eq("id", clientId)
    .is("renewal_choice", null)
    .is("renewal_prompt_closed_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export type RecordRenewalChoiceResult =
  | { ok: true }
  | { ok: false; reason: "already_closed" };

export async function recordRenewalChoice(
  client: SupabaseClient,
  clientId: string,
  choice: RenewalChoice,
  at = new Date(),
): Promise<RecordRenewalChoiceResult> {
  const stamp = at.toISOString();
  const { data, error } = await client
    .from("clients")
    .update({
      renewal_choice: choice,
      renewal_choice_at: stamp,
      renewal_prompt_closed_at: stamp,
    })
    .eq("id", clientId)
    .is("renewal_choice", null)
    .is("renewal_prompt_closed_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return { ok: false, reason: "already_closed" };
  return { ok: true };
}

export async function applyStripeForRenewalChoice(
  choice: RenewalChoice,
  stripeSubscriptionId: string,
): Promise<void> {
  if (!stripeUpdateForRenewalChoice(choice)) return;
  await pauseStripeSubscription(stripeSubscriptionId);
}

export function parseRenewalChoiceBody(body: unknown): RenewalChoice | null {
  if (!body || typeof body !== "object") return null;
  const choice = (body as { choice?: unknown }).choice;
  return isRenewalChoice(choice) ? choice : null;
}

export function clientStillOpenForRenewal(
  row: Pick<ClientRow, "renewal_choice" | "renewal_prompt_closed_at">,
): boolean {
  return !row.renewal_choice && !row.renewal_prompt_closed_at;
}
