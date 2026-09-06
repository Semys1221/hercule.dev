import { notFound } from "next/navigation";

import { ClientCockpit } from "@/components/internal/clients/cockpit/cockpit-shell";
import { loadClientCockpit } from "@/lib/admin/clients/load-cockpit";
import { isAudience } from "@/lib/admin/navigation";

type PageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export default async function ClientCockpitPage({ params }: PageProps) {
  const { category, slug } = await params;
  if (!isAudience(category)) {
    notFound();
  }

  const data = await loadClientCockpit(category, slug);
  if (!data) {
    notFound();
  }

  return <ClientCockpit initial={data} />;
}
