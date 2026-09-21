import { notFound } from "next/navigation";

import { ClientsShell } from "@/components/legacy/internal/clients/clients-shell";
import { NicheSwitcher } from "@/components/legacy/internal/funnels/niche-switcher";
import { segmentsFromModulePath } from "@/components/legacy/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/legacy/internal/funnels/ui/internal-page-header";
import { isNiche, NICHE_LABELS } from "@/lib/legacy/admin/navigation";
import { productPageTitle } from "@/lib/legacy/admin/funnels/ui-copy";

export default async function ClientsNichePage({
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
    <main className="mx-auto max-w-[1400px] px-6 py-8">
      <InternalPageHeader
        title={productPageTitle(label)}
        segments={segmentsFromModulePath("clients", niche)}
      />
      <div className="mb-6">
        <NicheSwitcher />
      </div>
      <ClientsShell niche={niche} />
    </main>
  );
}
