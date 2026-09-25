"use client"

import Link from "next/link"

import { Footer } from "@/components/site/home/footer"
import { Navbar } from "@/components/site/home/navbar"

const PROFILE_FAQS = [
  {
    href: "/comptable/faq",
    title: "Comptable",
    description: "Projets de tenue, fiscalité et obligations administratives (BNC, BIC, TNS).",
  },
  {
    href: "/conseil-financier/faq",
    title: "Courtier financier",
    description: "Projets patrimoniaux, transmission et optimisation fiscale.",
  },
  {
    href: "/courtier-assurance/faq",
    title: "Courtier en assurance",
    description: "Projets prévoyance, santé collective et protection sociale (ORIAS).",
  },
  {
    href: "/agence/faq",
    title: "Agence",
    description: "Service Hercule pour les agences partenaires et le backend de mise en relation.",
  },
  {
    href: "/entreprise",
    title: "Entreprise",
    description: "Dirigeants TPE, PME et ETI en recherche d'un conseiller ou d'un prestataire.",
  },
] as const

export function FaqHubPage() {
  return (
    <div  className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-24 px-6">
        <div className="mx-auto w-full max-w-[1440px] px-8 md:px-16">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">
            ← Retour à l&apos;accueil
          </Link>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl text-foreground mb-4"
            style={{ letterSpacing: "-0.04em", fontWeight: 538, lineHeight: 1.1 }}
          >
            Questions fréquentes
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-10 max-w-2xl">
            Choisissez votre profil pour consulter la FAQ du courtage de projets B2B Hercule.
          </p>

          <div className="grid gap-4">
            {PROFILE_FAQS.map((profile) => (
              <Link
                key={profile.href}
                href={profile.href}
                className="block rounded-xl border border-border bg-muted/40 p-6 transition-colors hover:border-foreground/20"
              >
                <h2 className="text-foreground font-medium text-lg mb-2">{profile.title}</h2>
                <p className="text-muted-foreground text-sm">{profile.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
