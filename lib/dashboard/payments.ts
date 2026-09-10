import type { SupabaseClient } from "@supabase/supabase-js";

import {
  balanceCents,
  isLegacyAgenceOfferType,
  PAYMENT_PHASES,
  totalPriceCentsForOffer,
} from "@/lib/commercial/constants";
import type { DashboardPaymentSchedule } from "@/lib/dashboard/types";

export async function hasSucceededPayment(
  client: SupabaseClient,
  agenceId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("payments")
    .select("id")
    .eq("agence_id", agenceId)
    .eq("status", "succeeded")
    .in("payment_phase", [PAYMENT_PHASES.deposit, PAYMENT_PHASES.full])
    .limit(1);

  if (error) {
    throw new Error(`payments lookup failed: ${error.message}`);
  }

  if ((data?.length ?? 0) > 0) {
    return true;
  }

  const { data: legacyRows, error: legacyError } = await client
    .from("payments")
    .select("id")
    .eq("agence_id", agenceId)
    .eq("status", "succeeded")
    .limit(1);

  if (legacyError) {
    throw new Error(`payments legacy lookup failed: ${legacyError.message}`);
  }

  return (legacyRows?.length ?? 0) > 0;
}

export async function getAgencePaymentSchedule(
  client: SupabaseClient,
  agenceId: string,
  deliveryComplete: boolean,
): Promise<DashboardPaymentSchedule | null> {
  const { data: depositRow, error: depositError } = await client
    .from("payments")
    .select("offer_type, status, amount_cents, payment_phase")
    .eq("agence_id", agenceId)
    .in("payment_phase", [PAYMENT_PHASES.deposit, PAYMENT_PHASES.full])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (depositError) {
    throw new Error(`payments deposit lookup failed: ${depositError.message}`);
  }

  if (!depositRow) {
    const { data: legacyRow, error: legacyError } = await client
      .from("payments")
      .select("offer_type, status, amount_cents")
      .eq("agence_id", agenceId)
      .eq("status", "succeeded")
      .order("succeeded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (legacyError) {
      throw new Error(`payments legacy lookup failed: ${legacyError.message}`);
    }
    if (!legacyRow) {
      return null;
    }

    return {
      offerType: legacyRow.offer_type as string,
      depositPaid: legacyRow.status === "succeeded",
      balanceDue: false,
      balancePaid: true,
      balanceAmountCents: 0,
      deliveryComplete,
      isFastCheckout: false,
    };
  }

  const offerType = depositRow.offer_type as string;
  const depositPaid = depositRow.status === "succeeded";
  const isFullPayment = depositRow.payment_phase === PAYMENT_PHASES.full;

  if (isFullPayment && depositPaid) {
    return {
      offerType,
      depositPaid: true,
      balanceDue: false,
      balancePaid: true,
      balanceAmountCents: 0,
      deliveryComplete,
      isFastCheckout: true,
    };
  }

  const usesSplitPayment =
    depositPaid && !isLegacyAgenceOfferType(offerType);
  const balanceAmountCents = usesSplitPayment
    ? balanceCents(totalPriceCentsForOffer(offerType))
    : 0;

  const { data: balanceRow, error: balanceError } = await client
    .from("payments")
    .select("status")
    .eq("agence_id", agenceId)
    .eq("payment_phase", PAYMENT_PHASES.balance)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (balanceError) {
    throw new Error(`payments balance lookup failed: ${balanceError.message}`);
  }

  const balancePaid = balanceRow?.status === "succeeded";
  const balanceDue =
    usesSplitPayment && deliveryComplete && depositPaid && !balancePaid;

  return {
    offerType,
    depositPaid,
    balanceDue,
    balancePaid: usesSplitPayment ? balancePaid : true,
    balanceAmountCents,
    deliveryComplete,
    isFastCheckout: false,
  };
}

export type ComptablePaymentOwner = "comptable" | "entreprise";

function paymentOwnerColumn(owner: ComptablePaymentOwner): "comptable_id" | "entreprise_id" {
  return owner === "comptable" ? "comptable_id" : "entreprise_id";
}

export async function hasSucceededPaymentComptable(
  client: SupabaseClient,
  leadId: string,
  owner: ComptablePaymentOwner = "comptable",
): Promise<boolean> {
  const { data, error } = await client
    .from("payments")
    .select("id, offer_type")
    .eq(paymentOwnerColumn(owner), leadId)
    .eq("status", "succeeded")
    .limit(1);

  if (error) {
    throw new Error(`payments comptable lookup failed: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}

export async function getComptablePaymentDetails(
  client: SupabaseClient,
  leadId: string,
  owner: ComptablePaymentOwner = "comptable",
): Promise<{ offerType: string; succeededAt: string } | null> {
  const { data, error } = await client
    .from("payments")
    .select("offer_type, succeeded_at")
    .eq(paymentOwnerColumn(owner), leadId)
    .eq("status", "succeeded")
    .order("succeeded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`payments comptable details lookup failed: ${error.message}`);
  }

  if (!data) return null;
  return {
    offerType: data.offer_type as string,
    succeededAt: data.succeeded_at as string,
  };
}
