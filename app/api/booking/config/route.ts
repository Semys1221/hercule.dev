import { NextResponse } from "next/server";

import { AGENCE_BOOKING_CLOSED, CONTACT_EMAIL } from "@/lib/constants";
import { COMMERCIAL } from "@/lib/commercial/constants";
import { getCalendlyBaseUrl } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    calendlyBaseUrl: getCalendlyBaseUrl(),
    agenceBookingClosed: AGENCE_BOOKING_CLOSED,
    agenceBookingClosedMessage: {
      title: "Nous sommes complets",
      pricing:
        `Les tarifs démarrent à ${(COMMERCIAL.starter998PriceCents / 100).toLocaleString("fr-FR")} €/mois.`,
      cta: `Pour réserver, envoyez un email au support : ${CONTACT_EMAIL}`,
      contactEmail: CONTACT_EMAIL,
    },
  });
}
