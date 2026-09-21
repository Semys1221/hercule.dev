import { notFound } from "next/navigation";

import { SalesFunnelShell } from "@/components/legacy/internal/funnels/sales/sales-funnel-module";
import { isNiche } from "@/lib/legacy/admin/navigation";

export default async function SalesCallPage({
  params,
}: Readonly<{
  params: Promise<{ niche: string }>;
}>) {
  const { niche } = await params;
  if (!isNiche(niche)) {
    notFound();
  }

  return <SalesFunnelShell audience={niche} />;
}
