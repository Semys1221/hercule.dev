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
      className="flex min-h-screen items-center justify-center bg-[#09090B] px-4 py-8 text-white"
      style={{ fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif" }}
    >
      <div
        className={cn(
          "flex w-[95%] overflow-hidden border border-[#27272a] bg-[#09090B] shadow-[0_0_80px_rgba(99,102,241,0.12)]",
          confirmed ? "max-w-[900px]" : "max-w-[720px]",
        )}
      >
        <aside
          className={cn(
            "relative hidden min-h-[620px] w-[45%] shrink-0 border-r border-[#27272a]",
            confirmed && "block",
          )}
        >
          <img
            src={EVAN_PORTRAIT_URL}
            alt="Evan"
            className="block h-full min-h-[620px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#09090B]/55" />
          <div className="absolute bottom-8 left-0 w-full text-center">
            <p className="m-0 text-[13px] font-medium uppercase tracking-[0.1em] text-white">
              Votre échange se fera avec Evan
            </p>
          </div>
        </aside>
        <div
          className={cn(
            "flex w-full flex-col items-center bg-[#09090B] text-center",
            confirmed ? "justify-center px-[52px] py-14" : "w-full justify-start px-6 py-8",
          )}
        >
          <div className="mb-8">
            <Link
              href={brandHref}
              className="inline-flex items-center gap-2.5 text-[15px] font-semibold text-white no-underline"
            >
              <HerculeMark className="size-5 text-white" />
              <span>Hercule</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
