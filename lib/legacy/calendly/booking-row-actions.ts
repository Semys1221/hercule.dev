import type { SalesCallStatus } from "@/lib/legacy/sales-calls/types";

export type BookingWorkflowAction = "no_show" | "not_paid" | "lost";

export type BookingRowActionState = {
  badge: "PAID" | "NO SHOW" | "NON PAYÉ" | "PERDU" | null;
  isPaid: boolean;
  isNoShow: boolean;
  canToggleNoShow: boolean;
  showNoShow: boolean;
  showNotPaid: boolean;
  showLost: boolean;
  showUnqualified: boolean;
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
      showLost: false,
      showUnqualified: false,
      showResetNoShow: false,
    };
  }
  if (status === "lost") {
    return {
      badge: "PERDU",
      isPaid: false,
      isNoShow: false,
      canToggleNoShow: false,
      showNoShow: false,
      showNotPaid: false,
      showLost: false,
      showUnqualified: false,
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
      showLost: false,
      showUnqualified: false,
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
      showLost: false,
      showUnqualified: false,
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
    showLost: true,
    showUnqualified: true,
    showResetNoShow: false,
  };
}
