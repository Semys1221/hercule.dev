import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BookingsShell } from "@/components/legacy/internal/funnels/bookings/bookings-shell";
import { segmentsFromModulePath } from "@/components/legacy/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/legacy/internal/ui/internal-page-header";
import { InternalPageShell } from "@/components/legacy/internal/ui/internal-page-shell";
import {
  BOOKINGS_MODULE_CAPTION,
  BOOKINGS_MODULE_LABEL,
} from "@/lib/legacy/admin/funnels/ui-copy";
import { isNiche, NICHE_LABELS } from "@/lib/legacy/admin/navigation";

export default async function RendezVousPage({
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
    <InternalPageShell>
      <InternalPageHeader
        title={BOOKINGS_MODULE_LABEL}
        description={`${BOOKINGS_MODULE_CAPTION} — ${label}.`}
        segments={segmentsFromModulePath("bookings", niche)}
      />
      <Suspense fallback={null}>
        <BookingsShell niche={niche} />
      </Suspense>
    </InternalPageShell>
  );
}
