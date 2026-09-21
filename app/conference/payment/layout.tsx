import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paiement — Conférence Hercule",
  description: "Finalisez votre accès Hercule DEC, CIF ou IAS",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConferencePaymentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
