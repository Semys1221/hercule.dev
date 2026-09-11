import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { dashboardDocumentTitle } from "@/lib/dashboard/copy";

type DashboardPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ paid?: string; session_id?: string }>;
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
  const { paid, session_id: checkoutSessionId } = await searchParams;

  return (
    <DashboardShell
      slug={slug}
      paidQuery={paid ?? null}
      checkoutSessionId={checkoutSessionId ?? null}
    />
  );
}
