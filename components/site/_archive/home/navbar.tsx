import Link from "next/link"

import { HerculeMark } from "@/components/hercule-mark"
import { MARKETING_NAV_PIPELINE } from "@/lib/site/marketing-copy"
import { marketingPageShellClassName } from "@/lib/site/marketing-layout"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className={`${marketingPageShellClassName()} flex items-center justify-between py-4`}>
        <Link href="/" className="flex items-center gap-2">
          <HerculeMark variant="dual" className="size-5 text-foreground" />
          <span className="font-semibold text-foreground">Hercule</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#methode"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Méthode
          </a>
          <a
            href="#missions"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {MARKETING_NAV_PIPELINE}
          </a>
          <a
            href="#garanties"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Garanties
          </a>
          <Link
            href="/faq"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </Link>
          <Link
            href="/a-propos"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            À propos
          </Link>
        </div>
      </div>
    </nav>
  )
}
