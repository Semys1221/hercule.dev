import Image from "next/image"
import Link from "next/link"

import { CONTACT_EMAIL, TEAM_IMAGE_URL } from "@/lib/constants"

export function FooterLegalBar() {
  return (
    <div className="mt-12 pt-8 border-t border-zinc-800 space-y-6">
      <Link
        href="/a-propos"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-200 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg px-4 py-2 transition-colors"
      >
        En savoir plus sur Hercule →
      </Link>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <Link href="/cvg" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          CGV
        </Link>
        <span className="text-zinc-700">·</span>
        <Link href="/mentions-legales" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          Mentions légales
        </Link>
        <span className="text-zinc-700">·</span>
        <Link href="/confidentialite" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          Confidentialité
        </Link>
        <span className="text-zinc-700">·</span>
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          {CONTACT_EMAIL}
        </a>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded-lg border border-zinc-800">
          <Image src={TEAM_IMAGE_URL} alt="Équipe Hercule" fill className="object-cover" sizes="48px" />
        </div>
        <div className="text-zinc-600 text-sm space-y-1">
          <p>Hercule est un groupement d&apos;entreprises dirigé par Evan.</p>
          <p>© {new Date().getFullYear()} Hercule</p>
        </div>
      </div>
    </div>
  )
}
