import { EnginClientRecord } from "@/components/engin/clients/engin-client-record";

type PageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function EnginClientPage({ params }: PageProps) {
  const { clientId } = await params;
  return <EnginClientRecord clientId={clientId} />;
}
