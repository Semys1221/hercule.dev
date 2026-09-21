import type { Metadata } from "next";

import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Espace client · Hercule",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ClientsLayout({
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
