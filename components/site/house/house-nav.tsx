import Link from "next/link"

import { HerculeMark } from "@/components/hercule-mark"
import { Button } from "@/components/ui/button"
import { marketingPageShellClassName } from "@/lib/site/marketing-layout"
import { HOUSE_NAV_LINKS } from "@/lib/site/house-copy"

export function HouseNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className={marketingPageShellClassName("flex h-16 items-center justify-between")}>
        <Link href="/" className="flex items-center gap-2">
          <HerculeMark variant="dual" className="size-5 text-foreground" />
          <span className="font-semibold text-foreground">Hercule</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {HOUSE_NAV_LINKS.map((item) =>
            item.href.startsWith("/") ? (
              <Button key={item.href} variant="ghost" size="sm" asChild>
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ) : (
              <Button key={item.href} variant="ghost" size="sm" asChild>
                <a href={item.href}>{item.label}</a>
              </Button>
            ),
          )}
        </nav>
      </div>
    </header>
  )
}
