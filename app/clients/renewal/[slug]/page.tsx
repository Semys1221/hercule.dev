import { ClientRenewalPage } from "@/components/clients/client-renewal-page";

type ClientRenewalRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function ClientRenewalRoute({ params }: ClientRenewalRouteProps) {
  const { slug } = await params;
  return <ClientRenewalPage slug={slug} />;
}
