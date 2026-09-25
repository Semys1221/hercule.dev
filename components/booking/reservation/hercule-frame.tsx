import Link from "next/link"

import { HerculeMark } from "@/components/hercule-mark"
import { EVAN_PORTRAIT_URL } from "@/lib/legacy/booking/reservation-surface"
import { cn } from "@/lib/utils"

type HerculeFrameProps = {
  confirmed: boolean
  brandHref?: string
  children: React.ReactNode
}

export function HerculeFrame({
  confirmed,
  brandHref = "/",
  children,
}: HerculeFrameProps) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground"
      style={{ fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif" }}
    >
      <div
        className={cn(
          "flex w-[95%] overflow-hidden border border-border bg-card shadow-lg",
          confirmed ? "max-w-[900px]" : "max-w-[720px]",
        )}
      >
        <aside
          className={cn(
            "relative hidden min-h-[620px] w-[45%] shrink-0 border-r border-border",
            confirmed && "block",
          )}
        >
          <img
            src={EVAN_PORTRAIT_URL}
            alt="Evan"
            className="block h-full min-h-[620px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-background/55" />
          <div className="absolute bottom-8 left-0 w-full text-center">
            <p className="m-0 text-[13px] font-medium uppercase tracking-[0.1em] text-foreground">
              Votre échange se fera avec Evan
            </p>
          </div>
        </aside>
        <div
          className={cn(
            "flex w-full flex-col items-center bg-card text-center text-card-foreground",
            confirmed ? "justify-center px-[52px] py-14" : "w-full justify-start px-6 py-8",
          )}
        >
          <div className="mb-8">
            <Link
              href={brandHref}
              className="inline-flex items-center gap-2.5 text-[15px] font-semibold text-foreground no-underline"
            >
              <HerculeMark className="size-5 text-foreground" />
              <span>Hercule</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
