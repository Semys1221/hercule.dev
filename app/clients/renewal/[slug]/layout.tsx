import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changer de formule · Hercule",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ClientRenewalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
