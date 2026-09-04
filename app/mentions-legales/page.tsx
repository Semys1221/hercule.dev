import type { Metadata } from "next"
import Link from "next/link"

import { LegalPageShell } from "@/components/site/legal-page-shell"
import { CONTACT_EMAIL, LEGAL_ENTITY } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Mentions légales — Hercule",
  description: "Informations légales et éditoriales du site Hercule.",
}

export default function MentionsLegalesPage() {
  return (
    <LegalPageShell>
      <h1 className="text-3xl md:text-4xl text-white font-medium tracking-tight mb-8">Mentions légales</h1>

      <section className="space-y-6 text-sm">
        <div>
          <h2 className="text-lg text-white font-medium mb-3">Éditeur du site</h2>
          <ul className="space-y-2 text-zinc-400 leading-relaxed">
            <li>
              <span className="text-zinc-300">Exploitant :</span> {LEGAL_ENTITY.legalName} ({LEGAL_ENTITY.director})
            </li>
            <li>
              <span className="text-zinc-300">Dénomination commerciale :</span> {LEGAL_ENTITY.commercialName}
            </li>
            <li>
              <span className="text-zinc-300">Nom commercial :</span> {LEGAL_ENTITY.tradeName}
            </li>
            <li>
              <span className="text-zinc-300">Adresse :</span> {LEGAL_ENTITY.address}
            </li>
            <li>
              <span className="text-zinc-300">Immatriculation :</span> {LEGAL_ENTITY.rcs} —{" "}
              {LEGAL_ENTITY.rcsRegistrationDate}
            </li>
            <li>
              <span className="text-zinc-300">Greffe :</span> {LEGAL_ENTITY.greffe}
            </li>
            <li>
              <span className="text-zinc-300">N° de gestion :</span> {LEGAL_ENTITY.gestionNumber}
            </li>
            <li>
              <span className="text-zinc-300">Site :</span> {LEGAL_ENTITY.website}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg text-white font-medium mb-3">Activité</h2>
          <p className="text-zinc-400 leading-relaxed">{LEGAL_ENTITY.activity}.</p>
        </div>

        <div>
          <h2 className="text-lg text-white font-medium mb-3">Directeur de la publication</h2>
          <p className="text-zinc-400 leading-relaxed">Evan Nanguy</p>
        </div>

        <div>
          <h2 className="text-lg text-white font-medium mb-3">Contact</h2>
          <p className="text-zinc-400 leading-relaxed">
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-zinc-200 hover:text-white underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        <div>
          <h2 className="text-lg text-white font-medium mb-3">Hébergement</h2>
          <p className="text-zinc-400 leading-relaxed">
            Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —{" "}
            <a
              href="https://vercel.com"
              className="text-zinc-200 hover:text-white underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              vercel.com
            </a>
          </p>
        </div>

        <div>
          <h2 className="text-lg text-white font-medium mb-3">Documents associés</h2>
          <p className="text-zinc-400 leading-relaxed">
            <Link href="/cvg" className="text-zinc-200 hover:text-white underline underline-offset-2">
              Conditions Générales de Vente
            </Link>
            {" · "}
            <Link href="/confidentialite" className="text-zinc-200 hover:text-white underline underline-offset-2">
              Politique de confidentialité
            </Link>
          </p>
        </div>
      </section>
    </LegalPageShell>
  )
}
