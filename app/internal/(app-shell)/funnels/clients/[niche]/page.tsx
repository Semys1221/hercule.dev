import { notFound } from "next/navigation";

import { ClientsTable } from "@/components/internal/clients/clients-table";
import { FunnelPlaceholder } from "@/components/internal/funnels/placeholder";
import { NicheSwitcher } from "@/components/internal/funnels/niche-switcher";
import { segmentsFromModulePath } from "@/components/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { isNiche, NICHE_LABELS } from "@/lib/admin/navigation";
import { productPageTitle } from "@/lib/admin/funnels/ui-copy";

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
      {niche === "agence" ? (
        <ClientsTable />
      ) : (
        <FunnelPlaceholder
          title="Clients"
          detail="Disponible pour l'audience agence uniquement (Phase 5)."
        />
      )}
    </main>
  );
}
