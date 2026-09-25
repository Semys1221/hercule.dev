import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { marketingPageShellClassName } from "@/lib/site/marketing-layout"
import { getHouseFooterTagline, type HouseAudience } from "@/lib/site/house-copy"

type HouseFooterProps = {
  audience?: HouseAudience
}

const FOOTER_COLUMNS: Record<string, { label: string; href: string }[]> = {
  Offre: [
    { label: "Méthode", href: "#methode" },
    { label: "Projets", href: "#missions" },
    { label: "Garanties", href: "#garanties" },
    { label: "FAQ", href: "/faq" },
  ],
  Profils: [
    { label: "Comptable", href: "/comptable" },
    { label: "Conseil financier", href: "/conseil-financier" },
    { label: "Courtage", href: "/courtier-assurance" },
    { label: "Agence", href: "/agence" },
    { label: "Entreprise", href: "/entreprise" },
  ],
  Société: [{ label: "À propos", href: "/a-propos" }],
  Légal: [
    { label: "CGV", href: "/cvg" },
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "Confidentialité", href: "/confidentialite" },
  ],
}

export function HouseFooter({ audience = "home" }: HouseFooterProps) {
  const tagline = getHouseFooterTagline(audience)

  return (
    <footer className="border-t border-border bg-background py-16">
      <div className={marketingPageShellClassName()}>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-foreground">Hercule</p>
            <p className="text-sm text-muted-foreground">{tagline}</p>
          </div>
          {Object.entries(FOOTER_COLUMNS).map(([title, links]) => (
            <div key={title} className="flex flex-col gap-3">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <div className="flex flex-col items-start gap-1">
                {links.map((link) =>
                  link.href.startsWith("#") ? (
                    <Button key={link.label} variant="link" className="h-auto p-0" asChild>
                      <a href={link.href}>{link.label}</a>
                    </Button>
                  ) : (
                    <Button key={link.label} variant="link" className="h-auto p-0" asChild>
                      <Link href={link.href}>{link.label}</Link>
                    </Button>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
        <Separator className="my-10" />
        <p className="text-sm text-muted-foreground">
          Hercule est un groupement d&apos;entreprises dirigé par Evan. · © {new Date().getFullYear()}{" "}
          Hercule ·{" "}
          <a href="mailto:contact@hercule.dev" className="underline-offset-4 hover:underline">
            contact@hercule.dev
          </a>
        </p>
      </div>
    </footer>
  )
}
