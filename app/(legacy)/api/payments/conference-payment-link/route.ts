import { NextResponse } from "next/server";
import { z } from "zod";

import {
  CONFERENCE_CARDS,
  hasSecondaryVertical,
  offerTypeForCheckout,
  resolveConferenceClientType,
  type ConferenceBilling,
} from "@/lib/commercial/conference-pricing";
import { assertConferenceCheckoutOpen } from "@/lib/conference/sale-window-store";
import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import { checkoutErrorResponse } from "@/lib/legacy/payments/checkout-errors";
import { createConferenceClientDraft } from "@/lib/legacy/payments/conference-client-draft";
import { paymentLinkUrlForConferenceOffer } from "@/lib/legacy/payments/conference-payment-links";

const bodySchema = z.object({
  card: z.enum([CONFERENCE_CARDS.dec, CONFERENCE_CARDS.courtage]),
  billing: z.enum(["monthly", "pack"]),
  selections: z.object({
    cif: z.boolean(),
    ias: z.boolean(),
  }),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { card, billing, selections } = parsed.data;

  const clientType = resolveConferenceClientType({ card, selections });
  if (!clientType) {
    return NextResponse.json(
      { error: "Sélectionnez au moins une verticale CIF ou IAS" },
      { status: 400 },
    );
  }

  const offerType = offerTypeForCheckout(clientType, billing as ConferenceBilling);

  try {
    const client = createLinkTrackingClient();
    try {
      await assertConferenceCheckoutOpen(client);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === "ConferenceSaleClosedError" ||
          error.message === "conference_sale_window_missing")
      ) {
        return NextResponse.json(
          { error: "Le lien n'est pas actif." },
          { status: 403 },
        );
      }
      throw error;
    }

    const draft = await createConferenceClientDraft(client, {
      clientType,
      billing: billing as ConferenceBilling,
      offerType,
      secondaryVertical: hasSecondaryVertical(selections) ? "ias" : null,
    });

    return NextResponse.json({
      url: paymentLinkUrlForConferenceOffer(offerType, draft.paymentId),
      slug: draft.slug,
      clientType,
    });
  } catch (error) {
    const { body: errorBody, status } = checkoutErrorResponse(
      error,
      "payments/conference-payment-link",
    );
    return NextResponse.json(errorBody, { status });
  }
}
