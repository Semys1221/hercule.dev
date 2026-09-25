import Link from "next/link"

import { HouseFooter } from "@/components/site/house/house-footer"
import { HouseHero } from "@/components/site/house/house-hero"
import { HouseNav } from "@/components/site/house/house-nav"
import { HouseSection } from "@/components/site/house/house-section"
import { marketingPageShellClassName } from "@/lib/site/marketing-layout"
import type { HouseAudience } from "@/lib/site/house-copy"

type HouseDocumentProps = {
  audience: HouseAudience
  backHref?: string
  backLabel?: string
  children: React.ReactNode
}

export function HouseDocument({
  audience,
  backHref = "/",
  backLabel = "Retour à l'accueil",
  children,
}: HouseDocumentProps) {
  return (
    <>
      <HouseNav />
      <HouseHero audience={audience} />
      <HouseSection>
        <div className={marketingPageShellClassName("flex flex-col gap-8")}>
          <Link
            href={backHref}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← {backLabel}
          </Link>
          {children}
        </div>
      </HouseSection>
      <HouseFooter audience={audience} />
    </>
  )
}
