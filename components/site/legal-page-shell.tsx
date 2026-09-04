import { Navbar } from "@/components/agence/navbar"
import { Footer } from "@/components/agence/footer"

export function LegalPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#09090B" }} className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-24 px-6">
        <div className="max-w-3xl mx-auto">{children}</div>
      </main>
      <Footer />
    </div>
  )
}
