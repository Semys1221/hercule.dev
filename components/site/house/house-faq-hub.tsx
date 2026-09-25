import Link from "next/link"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HouseDocument } from "@/components/site/house/house-document"

const HUB_ITEMS = [
  {
    href: "/comptable/faq",
    title: "Comptable",
    description: "Tenue, fiscalité, BNC, BIC, TNS.",
  },
  {
    href: "/conseil-financier/faq",
    title: "Conseil financier",
    description: "Patrimoine et transmission.",
  },
  {
    href: "/courtier-assurance/faq",
    title: "Courtage assurance",
    description: "Prévoyance et ORIAS.",
  },
  {
    href: "/agence/faq",
    title: "Agence",
    description: "Partenaires et déploiement.",
  },
  {
    href: "/entreprise",
    title: "Entreprise",
    description: "Dirigeants TPE, PME, ETI.",
  },
] as const

export function HouseFaqHub() {
  return (
    <HouseDocument audience="home">
      <div className="grid gap-4">
        {HUB_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="shadow-sm transition-colors hover:border-foreground/20">
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </HouseDocument>
  )
}
