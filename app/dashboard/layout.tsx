import type { Metadata } from "next";

import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Suivi de votre livraison · Hercule",
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
