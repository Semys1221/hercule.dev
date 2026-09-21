"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { BookingIntro } from "@/components/booking/reservation/booking-intro"
import { CalendlyInline } from "@/components/booking/reservation/calendly-inline"
import { HerculeFrame } from "@/components/booking/reservation/hercule-frame"
import { useReservationSession } from "@/components/booking/reservation/use-reservation-session"
import { buildCalendlySchedulingUrl } from "@/lib/legacy/booking/reservation-surface"

type ReservationAgenceProps = {
  slug: string
  email: string
  calendlyUrl: string
}

type ClosedMessage = {
  title?: string
  pricing?: string
  cta?: string
  contactEmail?: string
}

const STORAGE_EVENT_URI = "hercule_calendly_event"
const STORAGE_INVITEE_URI = "hercule_calendly_invitee"

const TIMELINE = [
  {
    title: "Votre agence",
    body: "Nous reviendrons sur votre activité, votre positionnement, vos objectifs et vos attentes en matière de développement.",
  },
  {
    title: "Vos demandes éligibles",
    body: "Nous vous présenterons les demandes actuellement disponibles que nous estimons les plus adaptées au profil et au positionnement de votre agence.",
  },
  {
    title: "Modalités et attribution",
    body: "Nous détaillerons les critères de qualification, les attentes des clients et le fonctionnement des attributions.",
  },
] as const

const FAQ = [
  {
    title: "D'où proviennent les demandes clients ?",
    paragraphs: [
      "Hercule détecte en continu des signaux d'intention sur plus de 1 000 sites : recrutements, développements, changements d'activité, etc.",
      "Les entreprises sont qualifiées par Hercule (besoin, budget, attentes). Une fois confirmé, la demande rejoint notre réseau et est proposée à l'agence la plus compatible.",
    ],
  },
  {
    title: "Comment Hercule choisit-il l'agence ?",
    paragraphs: [
      "Hercule évalue la compatibilité client-agence sur cinq critères : prestations, secteur d'excellence, taille, tarifs et positionnement.",
      "Objectif : aligner budget, structure et mode d'accompagnement.",
    ],
  },
  {
    title: "Comment fonctionnent les communications email d'Hercule ?",
    paragraphs: [
      "Hercule utilise plusieurs adresses et domaines dédiés à ses différentes communications. Le domaine principal de la société et de la plateforme est hercule.dev.",
    ],
  },
  {
    title: "Combien coûte Hercule ?",
    paragraphs: [
      "Starter : 1 489 € pour 5 attributions qualifiées.",
      "Renouvellement optionnel : 1 489 €/mois ou pack 989×3 = 2 967 € (15 attributions).",
      "L'offre 2 500 €/mois affichée sur le site est une vitrine non souscriptible.",
      "0 % de commission sur vos ventes.",
    ],
  },
  {
    title: "Disposez-vous d'un délai de rétractation ?",
    paragraphs: ["Oui. Après souscription, vous disposez d'un délai de 4 jours pour vous rétracter."],
  },
  {
    title: "Que signifie une demande visible sur hercule.dev ?",
    paragraphs: [
      "Chaque demande affichée correspond à un accord déjà obtenu avec le dirigeant. Un mandat de délégation a été signé pour une date cible (ex. novembre).",
      "Les dirigeants qui anticipent planifient leur acquisition marketing à l'avance — ils ne gèrent pas leur visibilité au coup par coup.",
    ],
  },
  {
    title: "Comment planifier les demandes à l'avance ?",
    paragraphs: [
      "Les demandes sont organisées par fenêtres calendaires (septembre–novembre). Une carte visible indique une intention confirmée pour la période affichée, pas une simple piste non qualifiée.",
    ],
  },
  {
    title: "Comment se passe ma mise en relation ?",
    paragraphs: [
      "Une fois votre fiche agence complétée, les dirigeants éligibles dont la demande entre dans la timeframe du mois reçoivent un email de proposition de mise en relation.",
      "Comptez environ 6 jours ouvrés pour voir le premier rendez-vous apparaître dans votre agenda.",
    ],
  },
] as const

function formatBookingTime(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoString))
  } catch {
    return ""
  }
}

function ManageBooking({ slug, email }: { slug: string; email: string }) {
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading")
  const [startTime, setStartTime] = useState<string | null>(null)
  const [cancelUrl, setCancelUrl] = useState<string | null>(null)
  const [rescheduleUrl, setRescheduleUrl] = useState<string | null>(null)

  useEffect(() => {
    const query = new URLSearchParams()
    const eventUri = sessionStorage.getItem(STORAGE_EVENT_URI) || ""
    const inviteeUri = sessionStorage.getItem(STORAGE_INVITEE_URI) || ""
    if (eventUri) query.set("eventUri", eventUri)
    if (inviteeUri) query.set("inviteeUri", inviteeUri)
    if (slug) query.set("code", slug)
    if (email) query.set("email", email)
    if (!eventUri && !inviteeUri && !slug && !email) {
      setStatus("fallback")
      return
    }
    void fetch(`/api/link-tracking/calendly-links?${query.toString()}`)
      .then(async (response) => {
        const data = (await response.json()) as {
          ok?: boolean
          cancelUrl?: string
          rescheduleUrl?: string
          startTime?: string
        }
        if (!response.ok || !data.ok || !data.cancelUrl || !data.rescheduleUrl) {
          setStatus("fallback")
          return
        }
        setCancelUrl(data.cancelUrl)
        setRescheduleUrl(data.rescheduleUrl)
        setStartTime(data.startTime ?? null)
        setStatus("ready")
      })
      .catch(() => setStatus("fallback"))
  }, [email, slug])

  if (status === "loading") {
    return <p className="text-sm text-zinc-400">Chargement des options…</p>
  }
  if (status === "fallback" || !cancelUrl || !rescheduleUrl) {
    return (
      <p className="text-sm text-zinc-400">
        Utilisez le lien reçu par email Calendly pour annuler ou reporter votre rendez-vous.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {startTime ? (
        <p className="text-sm text-zinc-300">
          Rendez-vous prévu le {formatBookingTime(startTime)}.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={rescheduleUrl} target="_blank" rel="noopener noreferrer">
            Reporter le rendez-vous
          </a>
        </Button>
        <Button asChild variant="destructive" size="sm">
          <a href={cancelUrl} target="_blank" rel="noopener noreferrer">
            Annuler le rendez-vous
          </a>
        </Button>
      </div>
    </div>
  )
}

export function ReservationAgence({ slug, email, calendlyUrl }: ReservationAgenceProps) {
  const session = useReservationSession({
    slug,
    calendlyUrl,
    pageTitle: "Réserver un échange · Hercule",
    confirmedTitle: "Rendez-vous confirmé · Hercule",
  })
  const widgetUrl = buildCalendlySchedulingUrl(session.calendlyUrl, { email, slug })
  const [closed, setClosed] = useState(false)
  const [closedMessage, setClosedMessage] = useState<ClosedMessage | null>(null)

  useEffect(() => {
    void fetch("/api/booking/config")
      .then(async (response) => {
        const data = (await response.json()) as {
          agenceBookingClosed?: boolean
          agenceBookingClosedMessage?: ClosedMessage
        }
        const isClosed = !data || data.agenceBookingClosed
        setClosed(Boolean(isClosed))
        setClosedMessage(data.agenceBookingClosedMessage ?? null)
      })
      .catch(() => setClosed(true))
  }, [])

  return (
    <HerculeFrame confirmed={session.confirmed} brandHref="/agence">
      {session.confirmed ? (
        <>
          <h2 className="mb-6 text-[28px] font-medium tracking-tight">
            Votre rendez-vous est confirmé
          </h2>
          <p className="mb-3 w-full text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Déroulement du rendez-vous
          </p>
          <Accordion type="single" collapsible className="mb-8 w-full text-left">
            {TIMELINE.map((item, index) => (
              <AccordionItem key={item.title} value={`step-${index}`}>
                <AccordionTrigger className="text-white hover:no-underline">
                  <span className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full border border-[#27272a] text-xs">
                      {index + 1}
                    </span>
                    {item.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">{item.body}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mb-3 w-full text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
            FAQ
          </p>
          <Accordion type="single" collapsible className="w-full text-left">
            {FAQ.map((item, index) => (
              <AccordionItem key={item.title} value={`faq-${index}`}>
                <AccordionTrigger className="text-white hover:no-underline">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-3 text-zinc-400">
                  {item.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
            <AccordionItem value="faq-manage">
              <AccordionTrigger className="text-white hover:no-underline">
                Votre disponibilité a changé ?
              </AccordionTrigger>
              <AccordionContent>
                <ManageBooking slug={slug} email={email} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      ) : (
        <>
          <h2 className="mb-2 text-[28px] font-medium tracking-tight">Planifier votre échange</h2>
          {closed ? (
            <div className="mt-6 max-w-[46ch] rounded-xl border border-[#27272a] px-6 py-8">
              <h3 className="mb-2 text-lg font-medium">
                {closedMessage?.title ?? "Nous sommes complets"}
              </h3>
              <p className="mb-3 text-sm text-zinc-400">
                {closedMessage?.pricing ?? "Les tarifs démarrent à 998 €/mois."}
              </p>
              <p className="text-sm text-zinc-400">
                {closedMessage?.cta ?? "Pour réserver, envoyez un email au support :"}{" "}
                <a
                  className="text-white underline"
                  href={`mailto:${closedMessage?.contactEmail ?? "contact@hercule.dev"}`}
                >
                  {closedMessage?.contactEmail ?? "contact@hercule.dev"}
                </a>
              </p>
            </div>
          ) : (
            <>
              <BookingIntro
                event="agence"
                fallback="Choisissez un créneau pour votre audit de compatibilité avec nos demandes."
              />
              <CalendlyInline
                url={widgetUrl}
                onScheduled={session.markConfirmed}
                className="w-full"
              />
            </>
          )}
        </>
      )}
    </HerculeFrame>
  )
}
