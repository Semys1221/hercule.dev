"use client"

import Link from "next/link"

import { Footer } from "@/components/site/home/footer"
import { HouseAtmosphere } from "@/components/site/home/house-atmosphere"
import { Navbar } from "@/components/site/home/navbar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { marketingPageShellClassName } from "@/lib/site/marketing-layout"
import { getFaqEntries } from "@/lib/site/faq"

export function EntreprisePage() {
  const entries = getFaqEntries("entreprise")

  return (
    <>
      <Navbar />
      <HouseAtmosphere />
      <div className="bg-background">
        <section className="house-archive-section py-16">
          <div className={marketingPageShellClassName()}>
            <h1
              className="text-4xl font-medium leading-[1.1] text-foreground md:text-5xl"
              style={{ letterSpacing: "-0.04em" }}
            >
              Entreprise
            </h1>
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Informations pour les dirigeants TPE, PME et ETI en recherche d&apos;un conseiller
              financier, d&apos;un expert-comptable ou d&apos;un courtier en assurance.
            </p>

            <Accordion
              type="single"
              collapsible
              className="mt-12 border border-border rounded-xl px-4 sm:px-6"
            >
              {entries.map((entry, index) => (
                <AccordionItem key={entry.id} value={`faq-${index}`} className="border-border">
                  <AccordionTrigger className="text-sm text-foreground hover:no-underline sm:text-base">
                    {entry.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">{entry.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <p className="mt-10 text-sm text-muted-foreground">
              <Link href="/" className="underline-offset-4 hover:text-foreground hover:underline">
                Retour à l&apos;accueil
              </Link>
            </p>
          </div>
        </section>
        <Footer />
      </div>
    </>
  )
}
