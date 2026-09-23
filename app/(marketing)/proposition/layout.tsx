import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proposition — Hercule",
  description: "Hercule Mercantile — acquisition DEC et courtage",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PropositionMarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="conference min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
