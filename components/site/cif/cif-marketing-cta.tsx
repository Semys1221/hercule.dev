import { CALENDLY_CIF_URL } from "@/lib/constants"
import { MarketingBookingCta } from "@/components/site/marketing-booking-cta"

type CifMarketingPrimaryCtaProps = {
  className?: string
}

export function CifMarketingPrimaryCta({ className }: CifMarketingPrimaryCtaProps) {
  return <MarketingBookingCta className={className} href={CALENDLY_CIF_URL} />
}
