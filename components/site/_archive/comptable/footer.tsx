import Link from "next/link"

import { FooterLegalBar } from "@/components/site/footer-legal-bar"
import { MARKETING_FOOTER_TAGLINE, MARKETING_NAV_PIPELINE } from "@/lib/site/marketing-copy"

const footerLinks: Record<string, { label: string; href: string }[]> = {
  Offre: [
    { label: "Méthode", href: "#methode" },
    { label: MARKETING_NAV_PIPELINE, href: "#missions" },
    { label: "Garanties", href: "#garanties" },
    { label: "FAQ", href: "/comptable/faq" },
    { label: "Contact", href: "#contact" },
  ],
  Profils: [
    { label: "Accueil", href: "/" },
    { label: "Courtier financier", href: "/conseil-financier" },
    { label: "Courtier en assurance", href: "/courtier-assurance" },
  ],
  Hercule: [{ label: "La société", href: "/a-propos" }],
  Légal: [
    { label: "CGV", href: "/cvg#dec" },
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "Confidentialité", href: "/confidentialite" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border py-16 px-6" >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div>
            <p className="text-foreground font-semibold text-lg mb-2">Hercule</p>
            <p className="text-muted-foreground text-sm max-w-xs">{MARKETING_FOOTER_TAGLINE}</p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-foreground font-medium text-sm mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("#") ? (
                      <a href={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <FooterLegalBar />
      </div>
    </footer>
  )
}
