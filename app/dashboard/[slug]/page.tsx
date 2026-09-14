import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { dashboardDocumentTitle } from "@/lib/dashboard/copy";

type DashboardPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ paid?: string; session_id?: string; checkout?: string; offer?: string }>;
};

export async function generateMetadata({ params }: Pick<DashboardPageProps, "params">) {
  const { slug } = await params;
  return {
    title: dashboardDocumentTitle(slug),
  };
}

export default async function DashboardPage({
  params,
  searchParams,
}: DashboardPageProps) {
  const { slug } = await params;
  const { paid, session_id: checkoutSessionId, checkout, offer } = await searchParams;

  return (
    <DashboardShell
      slug={slug}
      paidQuery={paid ?? null}
      checkoutSessionId={checkoutSessionId ?? null}
      checkoutQuery={checkout ?? null}
      offerQuery={offer ?? null}
    />
  );
}
