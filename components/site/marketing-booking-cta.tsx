import { PUBLIC_SITE_BOOKING_CLOSED } from "@/lib/constants"
import {
  MARKETING_INVITATION_ONLY_CTA,
  MARKETING_PRIMARY_CTA,
} from "@/lib/site/marketing-copy"
import { cn } from "@/lib/utils"

type MarketingBookingCtaProps = {
  className?: string
  href: string
  label?: string
}

export function MarketingBookingCta({
  className,
  href,
  label = MARKETING_PRIMARY_CTA,
}: MarketingBookingCtaProps) {
  if (PUBLIC_SITE_BOOKING_CLOSED) {
    // #region agent log
    if (typeof window !== "undefined") {
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "2688b0",
        },
        body: JSON.stringify({
          sessionId: "2688b0",
          runId: "post-fix",
          hypothesisId: "cta-closed",
          location: "marketing-booking-cta.tsx:render",
          message: "site booking CTA rendered invitation-only",
          data: { href, label },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
    }
    // #endregion
    return (
      <span
        className={cn("cursor-default select-none", className)}
        aria-disabled="true"
      >
        {MARKETING_INVITATION_ONLY_CTA}
      </span>
    )
  }

  return (
    <a href={href} className={className}>
      {label}
    </a>
  )
}
