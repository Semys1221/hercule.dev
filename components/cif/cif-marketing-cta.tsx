import { CALENDLY_CIF_URL, CIF_PUBLIC_BOOKING_CLOSED } from "@/lib/constants"
import {
  MARKETING_INVITATION_ONLY_CTA,
  MARKETING_PRIMARY_CTA,
} from "@/lib/site/marketing-copy"
import { cn } from "@/lib/utils"

type CifMarketingPrimaryCtaProps = {
  className?: string
}

export function CifMarketingPrimaryCta({ className }: CifMarketingPrimaryCtaProps) {
  if (CIF_PUBLIC_BOOKING_CLOSED) {
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
    <a href={CALENDLY_CIF_URL} className={className}>
      {MARKETING_PRIMARY_CTA}
    </a>
  )
}
