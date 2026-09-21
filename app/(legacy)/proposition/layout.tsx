import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proposition",
  description: "Proposition commerciale Hercule",
};

export default function PropositionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
