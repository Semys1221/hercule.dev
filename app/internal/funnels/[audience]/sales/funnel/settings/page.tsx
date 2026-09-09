import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SalesFunnelSettingsPage } from "@/components/internal/funnels/sales/sales-funnel-settings-page";
import { isAudience } from "@/lib/admin/navigation";

export default async function SalesFunnelSettingsRoute({
  params,
}: Readonly<{
  params: Promise<{ audience: string }>;
}>) {
  const { audience } = await params;
  if (!isAudience(audience)) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <SalesFunnelSettingsPage audience={audience} />
    </Suspense>
  );
}
