import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ReservationPageClient } from "@/components/booking/reservation/reservation-page-client"
import { resolveReservationSurface } from "@/lib/legacy/booking/reservation-surface"

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
