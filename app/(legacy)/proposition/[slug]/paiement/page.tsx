import { notFound, redirect } from "next/navigation";

import { getProposition } from "@/lib/legacy/propositions/registry";
import { resolveStripePaymentLinkUrl } from "@/lib/legacy/propositions/resolve-payment";

type PropositionPaymentPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ option?: string }>;
};

export default async function PropositionPaymentPage({
  params,
  searchParams,
}: PropositionPaymentPageProps) {
  const { slug } = await params;
  const { option } = await searchParams;

  const config = getProposition(slug);
  if (!config) {
    notFound();
  }

  const stripePaymentLinkUrl = resolveStripePaymentLinkUrl(config, option ?? null);
  redirect(stripePaymentLinkUrl);
}
