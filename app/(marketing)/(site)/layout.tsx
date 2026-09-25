export default function MarketingSiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="house min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}
