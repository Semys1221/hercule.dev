import { notFound } from "next/navigation";

import { BookingsShell } from "@/components/internal/funnels/bookings/bookings-shell";
import { segmentsFromModulePath } from "@/components/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { isNiche, NICHE_LABELS } from "@/lib/admin/navigation";
import { productPageTitle } from "@/lib/admin/funnels/ui-copy";

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
    <main className="mx-auto max-w-[1400px] px-6 py-8">
      <InternalPageHeader
        title={productPageTitle(label)}
        segments={segmentsFromModulePath("bookings", niche)}
      />
      <BookingsShell niche={niche} />
    </main>
  );
}
