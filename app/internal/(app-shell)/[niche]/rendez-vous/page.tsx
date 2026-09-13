import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BookingsShell } from "@/components/internal/funnels/bookings/bookings-shell";
import { segmentsFromModulePath } from "@/components/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/internal/ui/internal-page-header";
import { InternalPageShell } from "@/components/internal/ui/internal-page-shell";
import {
  BOOKINGS_MODULE_CAPTION,
  BOOKINGS_MODULE_LABEL,
} from "@/lib/admin/funnels/ui-copy";
import { isNiche, NICHE_LABELS } from "@/lib/admin/navigation";

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
