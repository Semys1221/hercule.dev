import { notFound } from "next/navigation";

import { BookingsShell } from "@/components/internal/funnels/bookings/bookings-shell";
import { NicheSwitcher } from "@/components/internal/funnels/niche-switcher";
import { segmentsFromModulePath } from "@/components/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { MODULES, isNiche, NICHE_LABELS } from "@/lib/admin/navigation";

export default async function BookingsNichePage({
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
        title={MODULES.bookings.label}
        description={`Pipeline Calendly, stats Instantly et séquences pour ${label}.`}
        segments={segmentsFromModulePath("bookings", niche)}
      />
      <div className="mb-6">
        <NicheSwitcher />
      </div>
      <BookingsShell niche={niche} />
    </main>
  );
}
