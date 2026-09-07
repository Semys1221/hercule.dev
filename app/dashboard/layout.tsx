import type { Metadata } from "next";

import { Toaster } from "@/components/ui/toaster";

import { DASHBOARD_EYEBROW } from "@/lib/dashboard/copy";

export const metadata: Metadata = {
  title: `${DASHBOARD_EYEBROW.replace(" :", "")} · Hercule`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="internal min-h-screen bg-background text-foreground">
      {children}
      <Toaster />
    </div>
  );
}
