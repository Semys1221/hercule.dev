import type { Metadata } from "next";

import { EnginAdminChrome } from "@/components/engin/engin-admin-chrome";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Engin · Hercule",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EnginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="internal min-h-screen bg-background text-foreground">
      <EnginAdminChrome>{children}</EnginAdminChrome>
      <Toaster />
    </div>
  );
}
