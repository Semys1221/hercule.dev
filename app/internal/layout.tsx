import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Internal",
  robots: {
    index: false,
    follow: false,
  },
};

export default function InternalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="internal min-h-screen bg-background text-foreground">{children}</div>
  );
}
