import { DashboardShell } from "@/components/dashboard/dashboard-shell";

type DashboardPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ paid?: string }>;
};

export default async function DashboardPage({
  params,
  searchParams,
}: DashboardPageProps) {
  const { slug } = await params;
  const { paid } = await searchParams;

  return <DashboardShell slug={slug} paidQuery={paid ?? null} />;
}
