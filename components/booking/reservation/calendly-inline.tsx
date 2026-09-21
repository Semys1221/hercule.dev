"use client"

import { useEffect, useId, useRef, useState } from "react"
import Script from "next/script"

import { cn } from "@/lib/utils"

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: {
        url: string
        parentElement: HTMLElement
        resize?: boolean
      }) => void
    }
  }
}

type CalendlyInlineProps = {
  url: string
  className?: string
  loaderClassName?: string
  minHeightClassName?: string
  onScheduled?: () => void
  enabled?: boolean
  tone?: "dark" | "light"
}

function isCalendlyEvent(event: MessageEvent): boolean {
  return (
    event.origin === "https://calendly.com" &&
    typeof event.data === "object" &&
    event.data !== null &&
    typeof (event.data as { event?: unknown }).event === "string" &&
    String((event.data as { event: string }).event).startsWith("calendly.")
  )
}

export function CalendlyInline({
  url,
  className,
  loaderClassName,
  minHeightClassName = "min-h-[620px]",
  onScheduled,
  enabled = true,
  tone = "dark",
}: CalendlyInlineProps) {
  const embedId = useId()
  const parentRef = useRef<HTMLDivElement | null>(null)
  const lastUrl = useRef<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [scriptReady, setScriptReady] = useState(false)

  useEffect(() => {
    if (!enabled) return

    function onMessage(event: MessageEvent) {
      if (!isCalendlyEvent(event)) return
      const name = (event.data as { event: string }).event
      if (
        name === "calendly.event_type_viewed" ||
        name === "calendly.profile_page_viewed" ||
        name === "calendly.page_height"
      ) {
        setLoaded(true)
      }
      if (name === "calendly.event_scheduled") {
        setLoaded(true)
        onScheduled?.()
      }
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [enabled, onScheduled])

  useEffect(() => {
    if (!enabled || !scriptReady || !window.Calendly || !parentRef.current) return
    if (lastUrl.current === url && parentRef.current.childElementCount > 0) return
    parentRef.current.replaceChildren()
    lastUrl.current = url
    window.Calendly.initInlineWidget({
      url,
      parentElement: parentRef.current,
      resize: true,
    })
  }, [enabled, scriptReady, url])

  useEffect(() => {
    if (!enabled) return
    const timeout = window.setTimeout(() => setLoaded(true), 8000)
    return () => window.clearTimeout(timeout)
  }, [enabled, url])

  if (!enabled) return null

  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div className={cn("relative", minHeightClassName, className)}>
        {!loaded ? (
          <div
            className={cn(
              "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3",
              tone === "dark" ? "bg-[#09090B]/90" : "bg-white/85",
              loaderClassName,
            )}
            aria-live="polite"
          >
            <div
              className={cn(
                "size-8 animate-spin rounded-full border-[3px]",
                tone === "dark"
                  ? "border-white/15 border-t-indigo-500"
                  : "border-black/10 border-t-[#1a1f28]",
              )}
              aria-hidden="true"
            />
            <p className={cn("text-sm", tone === "dark" ? "text-zinc-400" : "text-[#5c6570]")}>
              Chargement du calendrier…
            </p>
          </div>
        ) : null}
        <div
          id={embedId}
          ref={parentRef}
          className={cn("w-full", minHeightClassName)}
        />
      </div>
    </>
  )
}
