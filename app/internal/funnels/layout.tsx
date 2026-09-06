import type { Metadata } from "next";

import { PRODUCT_BUILDER_LABEL } from "@/lib/admin/funnels/ui-copy";

export const metadata: Metadata = {
  title: PRODUCT_BUILDER_LABEL,
  robots: {
    index: false,
    follow: false,
  },
};

export default function InternalFunnelsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
