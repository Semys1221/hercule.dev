import { notFound } from "next/navigation";

import { SalesFunnelShell } from "@/components/internal/funnels/sales/sales-funnel-module";
import { isAudience } from "@/lib/admin/navigation";

export default async function SalesFunnelSessionPage({
  params,
}: Readonly<{
  params: Promise<{ audience: string }>;
}>) {
  const { audience } = await params;
  if (!isAudience(audience)) {
    notFound();
  }

  return <SalesFunnelShell audience={audience} />;
}
