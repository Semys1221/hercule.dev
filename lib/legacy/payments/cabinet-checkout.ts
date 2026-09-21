import {
  OFFER_TYPES_COMPTABLE,
  type OfferTypeComptable,
} from "@/lib/commercial/constants";
import type { SlidersOfferId } from "@/lib/legacy/admin/funnels/sales-sliders";
import { COMPTABLE_OFFER_LABELS } from "@/lib/commercial/comptable-pricing";
import type { DashboardFaqAudience } from "@/lib/legacy/dashboard/types";
import { getPricingDocument } from "@/lib/site/pricing-data";

const OFFER_ORDER: OfferTypeComptable[] = [
  OFFER_TYPES_COMPTABLE.starter999_5,
  OFFER_TYPES_COMPTABLE.monthly1499,
  OFFER_TYPES_COMPTABLE.pack3x1499,
];

export type CabinetCheckoutAudience = Extract<DashboardFaqAudience, "comptable" | "cif">;

export type CabinetCheckoutOfferOption = {
  offerType: OfferTypeComptable;
  label: string;
  price: string;
  description: string;
  featured?: boolean;
};

type CheckoutClientSecretResponse = {
  clientSecret?: string;
  error?: string;
};

/** Stripe embedded checkout API for cabinet buyers (comptable or CIF table). */
export function cabinetCheckoutApiPath(audience: CabinetCheckoutAudience): string {
  return audience === "cif"
    ? "/api/payments/checkout-cif"
    : "/api/payments/checkout-comptable";
}

export function cabinetCheckoutBrandLabel(audience: CabinetCheckoutAudience): string {
  return audience === "cif" ? "CIF" : "Comptable";
}

export function buildCabinetCheckoutOfferOptions(
  audience: CabinetCheckoutAudience,
): CabinetCheckoutOfferOption[] {
  const document = getPricingDocument(audience);
  if (!document) {
    return [];
  }

  const byOfferType = new Map<string, (typeof document.plans)[number]>();
  for (const plan of document.plans) {
    if (plan.offerType) {
      byOfferType.set(plan.offerType, plan);
    }
  }

  const options: CabinetCheckoutOfferOption[] = [];
  for (const offerType of OFFER_ORDER) {
    const plan = byOfferType.get(offerType);
    if (!plan) {
      continue;
    }
    options.push({
      offerType,
      label: COMPTABLE_OFFER_LABELS[offerType],
      price: [plan.price, plan.priceSuffix].filter(Boolean).join(" "),
      description: plan.summary,
      featured: plan.featured,
    });
  }

  return options;
}

async function parseCheckoutErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as CheckoutClientSecretResponse;
    return body.error ?? "Paiement indisponible";
  } catch {
    return "Paiement indisponible";
  }
}

export function slidersOfferToOfferType(offer: SlidersOfferId): OfferTypeComptable {
  return offer === "core"
    ? OFFER_TYPES_COMPTABLE.starter999_5
    : OFFER_TYPES_COMPTABLE.monthly1499;
}

export function parseSlidersOfferQuery(
  offer: string | null | undefined,
): SlidersOfferId | null {
  if (offer === "core" || offer === "horizon") {
    return offer;
  }
  return null;
}

/** Resolve dashboard ?offer= into a Stripe checkout offer type (sliders + free trial). */
export function parseComptableCheckoutOfferQuery(
  offer: string | null | undefined,
): OfferTypeComptable | null {
  const raw = offer?.trim();
  if (!raw) {
    return null;
  }
  if (raw === OFFER_TYPES_COMPTABLE.monthly1499Trial) {
    return OFFER_TYPES_COMPTABLE.monthly1499Trial;
  }
  const sliders = parseSlidersOfferQuery(raw);
  if (sliders) {
    return slidersOfferToOfferType(sliders);
  }
  if (
    raw === OFFER_TYPES_COMPTABLE.starter999_5 ||
    raw === OFFER_TYPES_COMPTABLE.monthly1499 ||
    raw === OFFER_TYPES_COMPTABLE.pack3x1499
  ) {
    return raw;
  }
  return null;
}

export function buildCabinetCheckoutDashboardUrl(
  dashboardUrl: string,
  offer: SlidersOfferId,
): string {
  const url = new URL(dashboardUrl);
  url.searchParams.set("checkout", "1");
  url.searchParams.set("offer", offer);
  return url.toString();
}

/** Deep-link to embedded checkout for free-trial nurture CTAs. */
export function buildFreeTrialCheckoutDashboardUrl(dashboardUrl: string): string {
  const url = new URL(dashboardUrl);
  url.searchParams.set("checkout", "1");
  url.searchParams.set("offer", OFFER_TYPES_COMPTABLE.monthly1499Trial);
  return url.toString();
}

export async function requestCabinetCheckoutClientSecret(
  audience: CabinetCheckoutAudience,
  slug: string,
  offerType: OfferTypeComptable,
): Promise<string> {
  const response = await fetch(cabinetCheckoutApiPath(audience), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, offerType }),
  });

  if (!response.ok) {
    throw new Error(await parseCheckoutErrorMessage(response));
  }

  const data = (await response.json()) as CheckoutClientSecretResponse;
  if (!data.clientSecret) {
    throw new Error(data.error ?? "Paiement indisponible");
  }

  return data.clientSecret;
}
