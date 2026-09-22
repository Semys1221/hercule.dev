"use client";

import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

type PaymentTrustBadgesProps = {
  className?: string;
};

function VisaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 16"
      className={cn("h-3.5 w-auto", className)}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M19.5 15.5h-3.3l2.1-12.8h3.3l-2.1 12.8zm13.9-12.5c-.7-.3-1.7-.5-3-.5-3.3 0-5.6 1.7-5.6 4.2 0 1.8 1.7 2.8 3 3.4 1.3.6 1.8 1 1.8 1.5 0 .8-1.1 1.2-2.1 1.2-1.4 0-2.2-.2-3.4-.7l-.5-.2-.5 3.1c.9.4 2.5.7 4.2.7 3.5 0 5.8-1.7 5.8-4.3 0-1.4-.9-2.5-2.8-3.4-1.2-.6-1.9-1-1.9-1.6 0-.5.6-1.1 1.8-1.1 1 0 1.8.2 2.4.5l.3.2.5-2.9zm8.5-.3h-2.6c-.8 0-1.4.2-1.8 1l-5 11.8h3.5l.7-1.9h4.3l.4 1.9h3.1l-3.6-12.8zm-4.8 8.3 1.8-4.9.9 4.9h-2.7zM15.2.7 11.9 15.5H8.6L5.3.7h3.3l1.9 10.9L12.4.7h2.8z"
      />
    </svg>
  );
}

function MastercardLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 32"
      className={cn("h-7 w-auto", className)}
      aria-hidden
    >
      <circle cx="18" cy="16" r="10" fill="#EB001B" />
      <circle cx="30" cy="16" r="10" fill="#F79E1B" />
      <path
        d="M24 8.5a10 10 0 0 0 0 15 10 10 0 0 0 0-15z"
        fill="#FF5F00"
      />
    </svg>
  );
}

export function PaymentTrustBadges({ className }: PaymentTrustBadgesProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center justify-center gap-3", className)}
      role="img"
      aria-label="Paiement sécurisé — Visa, Mastercard"
    >
      <div className="flex h-10 items-center rounded-md border border-zinc-700/60 bg-zinc-900/40 px-3">
        <VisaLogo className="text-zinc-200" />
      </div>

      <div className="flex h-10 items-center rounded-md border border-zinc-700/60 bg-zinc-900/40 px-3">
        <MastercardLogo />
      </div>

      <div className="flex h-10 items-center gap-1.5 rounded-md border border-zinc-700/60 bg-zinc-900/40 px-3 text-zinc-400">
        <ShieldCheck className="size-3.5 shrink-0 text-emerald-500/80" strokeWidth={1.75} />
        <span className="text-[9px] font-medium tracking-[0.22em] uppercase">
          Secured
        </span>
      </div>
    </div>
  );
}
