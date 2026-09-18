import { notFound } from "next/navigation";

import { ManagementShell } from "@/components/internal/management/management-shell";
import { NicheSwitcher } from "@/components/internal/funnels/niche-switcher";
import { segmentsFromModulePath } from "@/components/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { MODULES, isNiche, NICHE_LABELS } from "@/lib/admin/navigation";

export default async function ManagementNichePage({
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
    <main className="mx-auto min-w-0 max-w-[1400px] px-6 py-8">
      <InternalPageHeader
        title={MODULES.management.label}
        description={`Destinataires de séquences email (Outreach, Booking, Client) — ${label}.`}
        segments={segmentsFromModulePath("management", niche)}
      />
      <div className="mb-6">
        <NicheSwitcher />
      </div>
      <ManagementShell niche={niche} />
    </main>
  );
}
