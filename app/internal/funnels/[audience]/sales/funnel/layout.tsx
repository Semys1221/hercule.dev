export default function SalesFunnelSessionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="h-svh w-full overflow-hidden bg-background">{children}</div>;
}
