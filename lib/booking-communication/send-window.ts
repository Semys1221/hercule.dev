import type { BookingEmailType } from "./types";

export {
  formatParisSlot,
  isWithinSendWindow,
  nextSendSlot,
} from "@/lib/instantly-bypass/send-window";

const SEND_WINDOW_BYPASS_TYPES: BookingEmailType[] = ["immediate"];

/** Mail 1 sends immediately, even outside the Paris weekday send window. */
export function bypassesSendWindow(emailType: BookingEmailType): boolean {
  return SEND_WINDOW_BYPASS_TYPES.includes(emailType);
}
