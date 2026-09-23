import { redirect } from "next/navigation";

type PropositionPaymentPageProps = {
  params: Promise<{ slug: string }>;
};

/** Legacy proposition checkout — conference Payment Links only. */
export default async function PropositionPaymentPage({
  params,
}: PropositionPaymentPageProps) {
  await params;
  redirect("/conference/inscription");
}
