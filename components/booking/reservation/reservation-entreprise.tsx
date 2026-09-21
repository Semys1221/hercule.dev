"use client"

import { Button } from "@/components/ui/button"
import { BookingIntro } from "@/components/booking/reservation/booking-intro"
import { CalendlyInline } from "@/components/booking/reservation/calendly-inline"
import { HerculeFrame } from "@/components/booking/reservation/hercule-frame"
import { useReservationSession } from "@/components/booking/reservation/use-reservation-session"
import { buildCalendlySchedulingUrl } from "@/lib/legacy/booking/reservation-surface"

type ReservationEntrepriseProps = {
  slug: string
  email: string
  calendlyUrl: string
}

export function ReservationEntreprise({
  slug,
  email,
  calendlyUrl,
}: ReservationEntrepriseProps) {
  const session = useReservationSession({
    slug,
    calendlyUrl,
    pageTitle: "Planifier votre échange · Hercule",
    confirmedTitle: "Rendez-vous confirmé · Hercule",
  })
  const widgetUrl = buildCalendlySchedulingUrl(session.calendlyUrl, { email, slug })

  return (
    <HerculeFrame confirmed={session.confirmed}>
      {session.confirmed ? (
        <>
          <h2 className="mb-4 text-[28px] font-medium tracking-tight">
            Votre rendez-vous est confirmé
          </h2>
          <div className="mb-8 w-full rounded-xl border border-[#27272a] bg-zinc-950/60 p-7 text-left">
            <h3 className="mb-3 text-base font-semibold">
              Pour préparer votre audit, nous recommandons les éléments suivants :
            </h3>
            <ul className="flex flex-col gap-2.5 pl-5 text-[15px] leading-relaxed text-zinc-300">
              <li>La taille de votre cabinet (associés et collaborateurs) — éligibilité : plus de 3.</li>
              <li>Votre zone d&apos;intervention et votre capacité à prendre de nouveaux dossiers.</li>
              <li>Vos honoraires typiques et votre périmètre d&apos;intervention (tenue, fiscal, social).</li>
              <li>Votre expérience en reprise de dossiers TPE et indépendants, le cas échéant.</li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              L&apos;échange portera sur la compatibilité de votre cabinet avec le déploiement du
              système Hercule sur votre zone — capture brandée, qualification et routage exclusif
              des flux TPE (comptabilité, échéances fiscales, déclarations et obligations
              administratives).
            </p>
          </div>
          <Button asChild className="rounded-full px-6">
            <a href="/">Retour au site Hercule</a>
          </Button>
        </>
      ) : (
        <>
          <h2 className="mb-2 text-[28px] font-medium tracking-tight">Planifier votre échange</h2>
          <BookingIntro
            event="entreprise"
            fallback="Choisissez un créneau pour votre audit de compatibilité avec nos demandes de tenue."
          />
          <CalendlyInline
            url={widgetUrl}
            onScheduled={session.markConfirmed}
            className="w-full"
          />
        </>
      )}
    </HerculeFrame>
  )
}
