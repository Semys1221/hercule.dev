export function Footer() {
  const footerLinks: Record<string, { label: string; href: string }[]> = {
    Offre: [
      { label: "Méthode", href: "#methode" },
      { label: "Tarification", href: "#pricing" },
      { label: "Garanties", href: "#garanties" },
      { label: "Contact", href: "#contact" },
    ],
    Agence: [
      { label: "À propos", href: "#contact" },
      { label: "Contact", href: "#contact" },
      { label: "Partenaires actifs", href: "#contact" },
    ],
    Légal: [
      { label: "Mentions légales", href: "#" },
      { label: "CGV", href: "#" },
      { label: "Confidentialité", href: "#" },
    ],
  }

  return (
    <footer className="border-t border-zinc-800 py-16 px-6" style={{ backgroundColor: "#09090B" }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <p className="text-white font-semibold text-lg mb-2">Hercule</p>
            <p className="text-zinc-500 text-sm max-w-xs">
              Courtage de prospects qualifiés pour agences web — identification, qualification et rendez-vous en exclusivité.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-medium text-sm mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
                      {link.label}
                    </a>
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
