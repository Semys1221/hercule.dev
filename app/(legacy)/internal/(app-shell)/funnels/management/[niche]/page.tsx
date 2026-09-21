import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ManagementShell } from "@/components/legacy/internal/management/management-shell";
import { NicheSwitcher } from "@/components/legacy/internal/funnels/niche-switcher";
import { segmentsFromModulePath } from "@/components/legacy/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/legacy/internal/funnels/ui/internal-page-header";
import { MODULES, isNiche, NICHE_LABELS } from "@/lib/legacy/admin/navigation";

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
      <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement…</div>}>
        <ManagementShell niche={niche} />
      </Suspense>
    </main>
  );
}
