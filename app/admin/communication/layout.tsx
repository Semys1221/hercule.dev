import { CommunicationSubNav } from "@/components/engin/communication/communication-sub-nav";

export default function CommunicationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-6">
      <CommunicationSubNav />
      {children}
    </div>
  );
}
