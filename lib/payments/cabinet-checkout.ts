import type { DashboardFaqAudience } from "@/lib/dashboard/types";

/** Stripe embedded checkout API for cabinet buyers (comptable or CIF table). */
export function cabinetCheckoutApiPath(
  audience: Extract<DashboardFaqAudience, "comptable" | "cif">,
): string {
  return audience === "cif"
    ? "/api/payments/checkout-cif"
    : "/api/payments/checkout-comptable";
}
