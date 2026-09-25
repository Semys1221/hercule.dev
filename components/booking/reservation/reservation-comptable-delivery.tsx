"use client"

import { ComptableDeliveryFunnel } from "@/components/booking/comptable-delivery-funnel/comptable-delivery-funnel"
import type { FunnelRouteSegment } from "@/lib/booking/comptable-delivery-funnel/schema"

export type ReservationComptableDeliveryProps = {
  slug: string
  email: string
  calendlyUrl: string
  routeSegment: FunnelRouteSegment
}

export function ReservationComptableDelivery({
  slug,
  email,
  calendlyUrl,
  routeSegment,
}: ReservationComptableDeliveryProps) {
  return (
    <ComptableDeliveryFunnel
      slug={slug}
      email={email}
      calendlyUrl={calendlyUrl}
      routeSegment={routeSegment}
    />
  )
}
