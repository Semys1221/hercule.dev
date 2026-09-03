import Link from "next/link"

export function Footer() {
  const footerLinks: Record<string, { label: string; href: string }[]> = {
    Service: [
      { label: "Comment ça marche", href: "#methode" },
      { label: "Notre modèle", href: "#modele" },
      { label: "Contact", href: "#contact" },
    ],
    Hercule: [{ label: "Espace agence", href: "/" }],
  }

  return (
    <footer className="border-t border-zinc-800 py-16 px-6" style={{ backgroundColor: "#09090B" }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <p className="text-white font-semibold text-lg mb-2">Hercule</p>
            <p className="text-zinc-500 text-sm max-w-xs">
              Service gratuit de matching B2B entre entreprises et agences web.
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
        <p className="mt-12 text-zinc-600 text-sm">© {new Date().getFullYear()} Hercule · By Henri Fridzi</p>
      </div>
    </footer>
  )
}
