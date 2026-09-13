import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SalesFunnelSettingsPage } from "@/components/internal/funnels/sales/sales-funnel-settings-page";
import { isNiche } from "@/lib/admin/navigation";

export default async function SalesSettingsPage({
  params,
}: Readonly<{
  params: Promise<{ niche: string }>;
}>) {
  const { niche } = await params;
  if (!isNiche(niche)) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <SalesFunnelSettingsPage audience={niche} />
    </Suspense>
  );
}
