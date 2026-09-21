import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conférence — Hercule",
  description: "Espace conférence Hercule",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConferenceLayout({
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
