import { notFound } from "next/navigation";

import { SalesHubLanding } from "@/components/internal/funnels/sales/sales-hub-landing";
import { NicheSwitcher } from "@/components/internal/funnels/niche-switcher";
import { segmentsFromModulePath } from "@/components/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { isNiche, NICHE_LABELS } from "@/lib/admin/navigation";
import { productPageTitle } from "@/lib/admin/funnels/ui-copy";

export default async function SessionHubPage({
  params,
}: Readonly<{
  params: Promise<{ niche: string }>;
}>) {
  const { niche } = await params;
  if (!isNiche(niche)) {
    notFound();
  }

  const label = NICHE_LABELS[niche];

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <InternalPageHeader
        title={productPageTitle(label)}
        segments={segmentsFromModulePath("session", niche)}
      />
      <div className="mb-6">
        <NicheSwitcher />
      </div>
      <SalesHubLanding audience={niche} />
    </main>
  );
}
