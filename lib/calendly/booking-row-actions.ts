import type { SalesCallStatus } from "@/lib/sales-calls/types";

export type BookingWorkflowAction = "no_show" | "not_paid";

export type BookingRowActionState = {
  badge: "PAID" | "NO SHOW" | "NON PAYÉ" | null;
  isPaid: boolean;
  isNoShow: boolean;
  canToggleNoShow: boolean;
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
      isPaid: true,
      isNoShow: false,
      canToggleNoShow: false,
      showNoShow: false,
      showNotPaid: false,
      showNotPresent: false,
      showResetNoShow: false,
    };
  }
  if (status === "no_show") {
    return {
      badge: "NO SHOW",
      isPaid: false,
      isNoShow: true,
      canToggleNoShow: true,
      showNoShow: false,
      showNotPaid: false,
      showNotPresent: false,
      showResetNoShow: true,
    };
  }
  if (status === "not_paid") {
    return {
      badge: "NON PAYÉ",
      isPaid: false,
      isNoShow: false,
      canToggleNoShow: true,
      showNoShow: false,
      showNotPaid: false,
      showNotPresent: false,
      showResetNoShow: false,
    };
  }
  return {
    badge: null,
    isPaid: false,
    isNoShow: false,
    canToggleNoShow: true,
    showNoShow: true,
    showNotPaid: true,
    showNotPresent: true,
    showResetNoShow: false,
  };
}
