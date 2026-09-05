"use client"

import Link from "next/link"

import { Footer } from "@/components/agence/footer"
import { Navbar } from "@/components/agence/navbar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AGENCE_FAQ } from "@/lib/site/agence-faq"

function FaqAnswer({ answer, cvgLink }: { answer: string; cvgLink?: boolean }) {
  return (
    <p className="text-zinc-400 text-sm leading-relaxed">
      {answer}
      {cvgLink && (
        <>
          {" "}
          <Link href="/cvg" className="text-zinc-300 hover:text-white underline underline-offset-2">
            Voir les CGV
          </Link>
        </>
      )}
    </p>
  )
}

export function AgenceFaqPage() {
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
            Réponses aux questions les plus courantes sur le service Hercule pour les agences partenaires.
          </p>

          <Accordion type="single" collapsible className="border border-zinc-800 rounded-xl px-4 sm:px-6">
            {AGENCE_FAQ.map((entry, index) => (
              <AccordionItem key={entry.question} value={`faq-${index}`} className="border-zinc-800">
                <AccordionTrigger className="text-white hover:no-underline hover:text-zinc-200 text-sm sm:text-base">
                  {entry.question}
                </AccordionTrigger>
                <AccordionContent>
                  <FaqAnswer answer={entry.answer} cvgLink={entry.cvgLink} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  )
}
