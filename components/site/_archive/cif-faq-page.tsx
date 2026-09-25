"use client"

import Link from "next/link"

import { Footer } from "@/components/site/cif/footer"
import { Navbar } from "@/components/site/cif/navbar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getFaqEntries } from "@/lib/site/faq"

function FaqAnswer({ answer, cvgLink }: { answer: string; cvgLink?: boolean }) {
  return (
    <p className="text-muted-foreground text-sm leading-relaxed">
      {answer}
      {cvgLink && (
        <>
          {" "}
          <Link href="/cvg#hubris" className="text-foreground hover:text-foreground underline underline-offset-2">
            Voir les CGV
          </Link>
        </>
      )}
    </p>
  )
}

export function CifFaqPage() {
  const entries = getFaqEntries("cif")

  return (
    <div  className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/conseil-financier" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">
            ← Retour à l&apos;accueil CIF
          </Link>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl text-foreground mb-4"
            style={{ letterSpacing: "-0.04em", fontWeight: 538, lineHeight: 1.1 }}
          >
            Questions fréquentes
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-10 max-w-2xl">
            Réponses aux questions les plus courantes sur le courtage de projets patrimoniaux Hercule pour les
            cabinets CIF / CGP.
          </p>

          <Accordion type="single" collapsible className="border border-border rounded-xl px-4 sm:px-6">
            {entries.map((entry, index) => (
              <AccordionItem key={entry.id} value={`faq-${index}`} className="border-border">
                <AccordionTrigger className="text-foreground hover:no-underline hover:text-foreground text-sm sm:text-base">
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
