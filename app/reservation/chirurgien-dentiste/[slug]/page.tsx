import { notFound } from "next/navigation"

import {
  ComptableDeliveryVerticalReservationPage,
  generateVerticalReservationMetadata,
} from "@/app/reservation/_lib/comptable-delivery-vertical-page"
import { loadClientBookingConfig } from "@/lib/clients/booking-config/load"

type PageProps = {
  params: Promise<{ slug: string }>
}

function dentisteEnabled(): boolean {
  try {
    const config = loadClientBookingConfig("pierremeniaud")
    return config.verticals["chirurgien-dentiste"]?.enabled === true
  } catch {
    return false
  }
}

export async function generateMetadata(props: PageProps) {
  if (!dentisteEnabled()) {
    return { title: "Réserver · Hercule" }
  }
  return generateVerticalReservationMetadata("chirurgien-dentiste", props.params)
}

export default async function ChirurgienDentisteReservationPage(props: PageProps) {
  if (!dentisteEnabled()) {
    notFound()
  }
  return (
    <ComptableDeliveryVerticalReservationPage
      params={props.params}
      routeSegment="chirurgien-dentiste"
    />
  )
}
