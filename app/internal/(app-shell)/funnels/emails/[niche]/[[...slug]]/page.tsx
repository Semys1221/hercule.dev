import { notFound } from "next/navigation";

import { EmailSequenceEditor } from "@/components/internal/funnels/email-sequence-editor";
import { EmailSequencesTable } from "@/components/internal/funnels/email-sequences-table";
import { NicheSwitcher } from "@/components/internal/funnels/niche-switcher";
import { segmentsFromModulePath } from "@/components/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { isEmailSequenceSlug } from "@/lib/admin/email-sequences/registry";
import { isNiche, NICHE_LABELS } from "@/lib/admin/navigation";
import { productPageTitle } from "@/lib/admin/funnels/ui-copy";

export default async function EmailsNichePage({
  params,
}: Readonly<{
  params: Promise<{ niche: string; slug?: string[] }>;
}>) {
  const { niche, slug = [] } = await params;
  if (!isNiche(niche)) {
    notFound();
  }

  const label = NICHE_LABELS[niche];
  const sequenceSlug = slug[0];

  if (!sequenceSlug) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <InternalPageHeader
          title={productPageTitle(label)}
          segments={segmentsFromModulePath("emails", niche)}
        />
        <div className="mb-6">
          <NicheSwitcher />
        </div>
        <EmailSequencesTable audience={niche} />
      </main>
    );
  }

  if (!isEmailSequenceSlug(sequenceSlug)) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <InternalPageHeader
        title={productPageTitle(label)}
        segments={segmentsFromModulePath("emails", niche)}
      />
      <div className="mb-6">
        <NicheSwitcher />
      </div>
      <EmailSequenceEditor audience={niche} sequenceSlug={sequenceSlug} />
    </main>
  );
}
