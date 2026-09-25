import Link from "next/link"

import { HouseDocument } from "@/components/site/house/house-document"
import { getMarketingCopy } from "@/lib/site/marketing-copy"

export function HouseAgencePage() {
  const copy = getMarketingCopy("agence")

  return (
    <HouseDocument audience="agence" backHref="/" backLabel="Retour à l'accueil">
      <div className="flex flex-col gap-6 text-muted-foreground">
        <p className="text-lg">{copy.bandeStack.text}</p>
        <p>{copy.bandeStack.subtext}</p>
        <Link href="/agence/faq" className="text-foreground underline-offset-4 hover:underline">
          FAQ agence
        </Link>
      </div>
    </HouseDocument>
  )
}
