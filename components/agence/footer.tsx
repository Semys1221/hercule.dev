import Link from "next/link"

import { FooterLegalBar } from "@/components/site/footer-legal-bar"

export function Footer() {
  const footerLinks: Record<string, { label: string; href: string }[]> = {
    Offre: [
      { label: "Méthode", href: "#methode" },
      { label: "Tarification", href: "#pricing" },
      { label: "Garanties", href: "#garanties" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "#contact" },
    ],
    Hercule: [{ label: "Trouver une agence", href: "/entreprise" }],
    Légal: [
      { label: "CGV", href: "/cvg" },
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "Confidentialité", href: "/confidentialite" },
    ],
  }

  return (
    <footer className="border-t border-zinc-800 py-16 px-6" style={{ backgroundColor: "#09090B" }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <p className="text-white font-semibold text-lg mb-2">Hercule</p>
            <p className="text-zinc-500 text-sm max-w-xs">
              Nous trouvons les bonnes agences pour nos demandes clients.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-medium text-sm mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("#") ? (
                      <a href={link.href} className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
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
