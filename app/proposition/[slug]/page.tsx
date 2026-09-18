import { notFound } from "next/navigation";

import { PropositionScene } from "@/components/proposition/proposition-scene";
import { getProposition } from "@/lib/propositions/registry";

type PropositionSlugPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PropositionSlugPage({ params }: PropositionSlugPageProps) {
  const { slug } = await params;

  if (!getProposition(slug)) {
    notFound();
  }

  return <PropositionScene slug={slug} />;
}
