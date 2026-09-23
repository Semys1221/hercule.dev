import { isClientCalendarConnected } from "@/lib/clients/dashboard-connections";
import { isDecFreeTrialOffer, PRODUCT_STATUT_FREE_TRIAL } from "@/lib/clients/dec-free-trial";
import type { RoundRobinEligibilityReason } from "@/lib/clients/round-robin";
import type { ClientCalendlySeat, ClientRow } from "@/lib/clients/types";

export type OpsControlId = "onboarding" | "calendly" | "payment" | "pool";

export type OpsControlTab = "onboarding" | "calendly" | "ops" | "resume";

export type OpsControl = {
  id: OpsControlId;
  label: string;
  ok: boolean;
  tab: OpsControlTab;
};

export function clientOpsControls(input: {
  client: Pick<
    ClientRow,
    "onboarding_completed_at" | "calendly_scheduling_url" | "profile"
  > &
    Partial<Pick<ClientRow, "product_statut" | "offer_type">>;
  eligibility: RoundRobinEligibilityReason;
  hasSucceededPayment: boolean;
  calendlySeat?: ClientCalendlySeat | null;
}): OpsControl[] {
  const schedulingUrl = input.client.calendly_scheduling_url?.trim() ?? "";
  const ownCalendlyTrial =
    input.client.product_statut === PRODUCT_STATUT_FREE_TRIAL &&
    isDecFreeTrialOffer(input.client.offer_type);
  const calendlyOk = ownCalendlyTrial
    ? Boolean(schedulingUrl)
    : Boolean(schedulingUrl) &&
      isClientCalendarConnected({
        profile: input.client.profile,
        calendlySeat: input.calendlySeat,
      });

  return [
    {
      id: "onboarding",
      label: "Onboarding complété",
      ok: Boolean(input.client.onboarding_completed_at?.trim()),
      tab: "onboarding",
    },
    {
      id: "calendly",
      label: "Calendly confirmé",
      ok: calendlyOk,
      tab: "calendly",
    },
    {
      id: "payment",
      label: "Paiement reçu",
      ok: input.hasSucceededPayment,
      tab: "ops",
    },
    {
      id: "pool",
      label: "Pool éligible",
      ok: input.eligibility === "eligible",
      tab: "resume",
    },
  ];
}

export function clientNeedsOps(controls: OpsControl[]): boolean {
  return controls.some((control) => !control.ok);
}
