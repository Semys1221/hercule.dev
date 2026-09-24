import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { ReservationPageClient } from "@/components/booking/reservation/reservation-page-client"
import { routeSegmentForComptableDeliverySegment } from "@/lib/legacy/admin/niches/comptable-delivery-verticals"
import {
  readComptableDeliverySegmentFromLead,
  resolveReservationSurface,
} from "@/lib/legacy/booking/reservation-surface"
import {
  createLinkTrackingClient,
  findLeadByLink,
} from "@/lib/legacy/link-tracking/supabase"

type ReservationPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ReservationPageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const surface = await resolveReservationSurface(slug)
    if (!surface) {
      return { title: "Réserver · Hercule" }
    }
    return { title: surface.copy.pageTitle }
  } catch {
    return { title: "Réserver · Hercule" }
  }
}

export default async function ReservationPage({ params }: ReservationPageProps) {
  const { slug } = await params
  const trimmed = slug.trim()
  if (trimmed) {
    const client = createLinkTrackingClient()
    const lookup = await findLeadByLink(client, trimmed)
    if (lookup?.category === "comptable_delivery") {
      const segment = readComptableDeliverySegmentFromLead(lookup.lead)
      const routeSegment = routeSegmentForComptableDeliverySegment(segment)
      redirect(`/reservation/${routeSegment}/${lookup.lead.slug}`)
    }
  }

  const surface = await resolveReservationSurface(slug)
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
