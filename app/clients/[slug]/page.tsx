import { ClientDashboardShell } from "@/components/clients/client-dashboard-shell";

type ClientPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ client_type?: string; paid?: string; session_id?: string }>;
};

export async function generateMetadata({ params }: Pick<ClientPageProps, "params">) {
  const { slug } = await params;
  return {
    title: `${slug} · Espace client · Hercule`,
  };
}

export default async function ClientPage({ params, searchParams }: ClientPageProps) {
  const { slug } = await params;
  const { paid, session_id: checkoutSessionId } = await searchParams;

  return (
    <ClientDashboardShell
      slug={slug}
      paidQuery={paid ?? null}
      checkoutSessionId={checkoutSessionId ?? null}
    />
  );
}
