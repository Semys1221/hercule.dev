import { Footer } from "@/components/site/comptable/footer"
import { Navbar } from "@/components/site/comptable/navbar"
import { marketingPageShellClassName } from "@/lib/site/marketing-layout"

export function LegalPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className={marketingPageShellClassName()}>{children}</div>
      </main>
      <Footer />
    </div>
  )
}
