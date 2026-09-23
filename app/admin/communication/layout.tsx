import { CommunicationSubNav } from "@/components/engin/communication/communication-sub-nav";

export default function CommunicationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="engin-communication flex min-h-0 flex-1 flex-col gap-0">
      <CommunicationSubNav />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
