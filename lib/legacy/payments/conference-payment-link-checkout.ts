import type { ConferenceBilling, ConferenceCard } from "@/lib/commercial/conference-pricing";

export type ConferencePaymentLinkCheckoutSelection = {
  card: ConferenceCard;
  billing: ConferenceBilling;
  selections: { cif: boolean; ias: boolean };
};

export type ConferencePaymentLinkCheckoutResult = {
  url: string;
  slug?: string;
  clientType?: string;
};

export async function startConferencePaymentLinkCheckout(
  selection: ConferencePaymentLinkCheckoutSelection,
): Promise<ConferencePaymentLinkCheckoutResult> {
  const response = await fetch("/api/payments/conference-payment-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      card: selection.card,
      billing: selection.billing,
      selections: selection.selections,
    }),
  });
  const data = (await response.json()) as ConferencePaymentLinkCheckoutResult & {
    error?: string;
  };
  if (!response.ok || !data.url) {
    throw new Error(data.error ?? "Paiement indisponible");
  }
  return data;
}
