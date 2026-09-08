import type { SalesCallStatus } from "@/lib/sales-calls/types";

export type BookingWorkflowAction = "no_show" | "not_paid";

export type BookingRowActionState = {
  badge: "PAID" | "NO SHOW" | "NON PAYÉ" | null;
  showNoShow: boolean;
  showNotPaid: boolean;
  showNotPresent: boolean;
  showResetNoShow: boolean;
};

export function bookingRowActionState(
  status: SalesCallStatus | null | undefined,
): BookingRowActionState {
  if (status === "paid") {
    return {
      badge: "PAID",
      showNoShow: false,
      showNotPaid: false,
      showNotPresent: false,
      showResetNoShow: false,
    };
  }
  if (status === "no_show") {
    return {
      badge: "NO SHOW",
      showNoShow: false,
      showNotPaid: false,
      showNotPresent: false,
      showResetNoShow: true,
    };
  }
  if (status === "not_paid") {
    return {
      badge: "NON PAYÉ",
      showNoShow: false,
      showNotPaid: false,
      showNotPresent: false,
      showResetNoShow: false,
    };
  }
  return {
    badge: null,
    showNoShow: true,
    showNotPaid: true,
    showNotPresent: true,
    showResetNoShow: false,
  };
}
