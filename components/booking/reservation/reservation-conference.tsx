"use client"

import { Button } from "@/components/ui/button"
import { CalendlyInline } from "@/components/booking/reservation/calendly-inline"
import { HerculeFrame } from "@/components/booking/reservation/hercule-frame"
import { useReservationSession } from "@/components/booking/reservation/use-reservation-session"
import {
  buildCalendlySchedulingUrl,
  conferenceCopy,
  type ConferenceNiche,
} from "@/lib/legacy/booking/reservation-surface"

type ReservationConferenceProps = {
  slug: string
  email: string
  calendlyUrl: string
  niche: ConferenceNiche
}

export function ReservationConference({
  slug,
  email,
  calendlyUrl,
  niche,
}: ReservationConferenceProps) {
  const copy = conferenceCopy(niche)
  const session = useReservationSession({
    slug,
    calendlyUrl,
    pageTitle: copy.pageTitle,
    confirmedTitle: copy.confirmedTitle,
  })
  const widgetUrl = buildCalendlySchedulingUrl(session.calendlyUrl, { email, slug })

  return (
    <HerculeFrame confirmed={session.confirmed}>
      {session.confirmed ? (
        <>
          <h2 className="mb-4 text-[28px] font-medium tracking-tight">
            Votre inscription est confirmée
          </h2>
          <div className="mb-8 w-full rounded-xl border border-[#27272a] bg-zinc-950/60 p-7 text-left">
            <h3 className="mb-3 text-base font-semibold">{copy.confirmationHeading}</h3>
            <ul className="flex flex-col gap-2.5 pl-5 text-[15px] leading-relaxed text-zinc-300">
              <li>
                Session collective en visio —{" "}
                <span className="text-white">{copy.dateFull}</span> (heure de Paris).
              </li>
              {copy.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">{copy.contextText}</p>
          </div>
          <Button asChild className="rounded-full px-6">
            <a href="/">Retour au site Hercule</a>
          </Button>
        </>
      ) : (
        <>
          <div className="mb-6 w-full rounded-xl border border-[#27272a] px-5 py-4 text-center">
            <span className="mb-2 inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-200">
              Session collective limitée
            </span>
            <p className="m-0 text-lg font-medium">
              {copy.dateShort}
              <span className="ml-2 text-sm font-normal text-zinc-400">heure de Paris</span>
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Inscription ouverte selon nos capacités d&apos;accueil — places limitées pour
              garantir la qualité des échanges.
            </p>
          </div>
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
