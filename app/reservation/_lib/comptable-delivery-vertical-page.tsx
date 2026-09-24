import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ReservationPageClient } from "@/components/booking/reservation/reservation-page-client"
import type { ComptableDeliveryRouteSegment } from "@/lib/legacy/admin/niches/comptable-delivery-verticals"
import { resolveComptableDeliveryReservation } from "@/lib/clients/booking/resolve-comptable-delivery-reservation"

type VerticalPageProps = {
  params: Promise<{ slug: string }>
  routeSegment: ComptableDeliveryRouteSegment
}

export async function generateVerticalReservationMetadata(
  routeSegment: ComptableDeliveryRouteSegment,
  params: Promise<{ slug: string }>,
): Promise<Metadata> {
  const { slug } = await params
  try {
    const surface = await resolveComptableDeliveryReservation(routeSegment, slug)
    if (!surface) {
      return { title: "Réserver · Hercule" }
    }
    return { title: surface.copy.pageTitle }
  } catch {
    return { title: "Réserver · Hercule" }
  }
}

export async function ComptableDeliveryVerticalReservationPage({
  params,
  routeSegment,
}: VerticalPageProps) {
  const { slug } = await params
  const surface = await resolveComptableDeliveryReservation(routeSegment, slug)
  if (!surface) {
    notFound()
  }

  return (
    <ReservationPageClient
      slug={surface.slug}
      email={surface.email}
      calendlyUrl={surface.calendlyUrl}
      surface={surface.surface}
      conferenceNiche={surface.conferenceNiche}
    />
  )
}
