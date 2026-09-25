import { HouseFooter } from "@/components/site/house/house-footer"
import { HouseNav } from "@/components/site/house/house-nav"
import { marketingPageShellClassName } from "@/lib/site/marketing-layout"

export function HouseLegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HouseNav />
      <main className="bg-background pt-28 pb-24">
        <div className={marketingPageShellClassName()}>{children}</div>
      </main>
      <HouseFooter audience="home" />
    </>
  )
}
