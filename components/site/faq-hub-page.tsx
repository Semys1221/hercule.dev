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
] as const

export function FaqHubPage() {
  return (
    <div style={{ backgroundColor: "#09090B" }} className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8 inline-block">
            ← Retour à l&apos;accueil
          </Link>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl text-white mb-4"
            style={{ letterSpacing: "-0.04em", fontWeight: 538, lineHeight: 1.1 }}
          >
            Questions fréquentes
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed mb-10 max-w-2xl">
            Choisissez votre profil pour consulter la FAQ du courtage de projets B2B Hercule.
          </p>

          <div className="grid gap-4">
            {PROFILE_FAQS.map((profile) => (
              <Link
                key={profile.href}
                href={profile.href}
                className="block rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-zinc-600 transition-colors"
              >
                <h2 className="text-white font-medium text-lg mb-2">{profile.title}</h2>
                <p className="text-zinc-500 text-sm">{profile.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
