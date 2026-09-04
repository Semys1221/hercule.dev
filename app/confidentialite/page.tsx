import type { Metadata } from "next"
import Link from "next/link"

import { LegalPageShell } from "@/components/site/legal-page-shell"
import { CONTACT_EMAIL, LEGAL_ENTITY } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Politique de confidentialité — Hercule",
  description: "Politique de confidentialité et protection des données personnelles — Hercule.",
}

export default function ConfidentialitePage() {
  return (
    <LegalPageShell>
      <h1 className="text-3xl md:text-4xl text-white font-medium tracking-tight mb-8">
        Politique de confidentialité
      </h1>

      <section className="space-y-6 text-sm text-zinc-400 leading-relaxed">
        <p>
          La présente politique décrit la manière dont {LEGAL_ENTITY.commercialName}, exploité par{" "}
          {LEGAL_ENTITY.legalName}, traite les données personnelles dans le cadre de ses services B2B de mise en
          relation et de qualification.
        </p>

        <div>
          <h2 className="text-lg text-white font-medium mb-3">Responsable du traitement</h2>
          <p>
            {LEGAL_ENTITY.legalName} — {LEGAL_ENTITY.address}
            <br />
            Contact :{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-zinc-200 hover:text-white underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        <div>
          <h2 className="text-lg text-white font-medium mb-3">Finalités</h2>
          <ul className="list-disc list-inside space-y-2 ml-1">
            <li>Exécution du contrat et fourniture du service Hercule</li>
            <li>Qualification des demandes clients et audit de compatibilité des agences</li>
            <li>Organisation des rendez-vous commerciaux</li>
            <li>Facturation, support et communication opérationnelle</li>
            <li>Amélioration du service et suivi qualité</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg text-white font-medium mb-3">Base légale</h2>
          <p>
            Les traitements reposent principalement sur l&apos;exécution du contrat, l&apos;intérêt légitime du
            responsable de traitement et, le cas échéant, le consentement lorsque la réglementation l&apos;exige.
          </p>
        </div>

        <div>
          <h2 className="text-lg text-white font-medium mb-3">Durée de conservation</h2>
          <p>
            Les données sont conservées pendant la durée de la relation contractuelle, puis archivées conformément aux
            obligations légales applicables (comptabilité, preuve contractuelle).
          </p>
        </div>

        <div>
          <h2 className="text-lg text-white font-medium mb-3">Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de
            limitation, d&apos;opposition et de portabilité de vos données. Pour exercer vos droits, contactez-nous à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-zinc-200 hover:text-white underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            . Vous pouvez également introduire une réclamation auprès de la CNIL.
          </p>
        </div>

        <div>
          <h2 className="text-lg text-white font-medium mb-3">Documents associés</h2>
          <p>
            Pour le détail des flux de données dans le cadre contractuel, voir également les{" "}
            <Link href="/cvg" className="text-zinc-200 hover:text-white underline underline-offset-2">
              Conditions Générales de Vente
            </Link>{" "}
            (section Données personnelles).
          </p>
        </div>
      </section>
    </LegalPageShell>
  )
}
