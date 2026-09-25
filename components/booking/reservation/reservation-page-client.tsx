"use client"

import { ReservationAgence } from "@/components/booking/reservation/reservation-agence"
import { ReservationConference } from "@/components/booking/reservation/reservation-conference"
import { ReservationEntreprise } from "@/components/booking/reservation/reservation-entreprise"
import { ReservationComptableDelivery } from "@/components/booking/reservation/reservation-comptable-delivery"
import type {
  ConferenceNiche,
  ReservationSurface,
} from "@/lib/legacy/booking/reservation-surface"

export type ReservationPageClientProps = {
  slug: string
  email: string
  calendlyUrl: string
  surface: ReservationSurface
  conferenceNiche: ConferenceNiche | null
  comptableDeliveryRouteSegment?:
    | "restaurant"
    | "btp"
    | "chirurgien-dentiste"
    | null
}

export function ReservationPageClient(props: ReservationPageClientProps) {
  if (props.surface === "conference") {
    return (
      <ReservationConference
        slug={props.slug}
        email={props.email}
        calendlyUrl={props.calendlyUrl}
        niche={props.conferenceNiche ?? "cif"}
      />
    )
  }
  if (props.surface === "comptable_delivery") {
    const routeSegment = props.comptableDeliveryRouteSegment ?? "restaurant"
    return (
      <ReservationComptableDelivery
        slug={props.slug}
        email={props.email}
        calendlyUrl={props.calendlyUrl}
        routeSegment={routeSegment}
      />
    )
  }
  if (props.surface === "agence") {
    return (
      <ReservationAgence
        slug={props.slug}
        email={props.email}
        calendlyUrl={props.calendlyUrl}
      />
    )
  }
  return (
    <ReservationEntreprise
      slug={props.slug}
      email={props.email}
      calendlyUrl={props.calendlyUrl}
    />
  )
}
