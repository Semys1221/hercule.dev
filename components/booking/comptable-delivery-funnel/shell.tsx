"use client";

import Image from "next/image";

import type { VerticalCopyBundle } from "@/lib/booking/comptable-delivery-funnel/copy";

type ComptableDeliveryFunnelShellProps = {
  copy: VerticalCopyBundle;
  children: React.ReactNode;
  showHero?: boolean;
};

export function ComptableDeliveryFunnelShell({
  copy,
  children,
  showHero = true,
}: ComptableDeliveryFunnelShellProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-100 via-orange-50 to-teal-100 p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1000px] overflow-hidden rounded-2xl bg-background shadow-2xl md:rounded-[2.5rem]">
        <div className="grid min-h-[min(700px,90vh)] gap-0 lg:grid-cols-2">
          <div className="flex flex-col justify-center p-6 lg:p-10">
            <header className="mb-6 text-center lg:text-left">
              <div className="font-[family-name:var(--font-jum-serif)] text-xl font-semibold tracking-[0.12em] text-foreground">
                {copy.brandLabel}
              </div>
            </header>
            <div className="mx-auto w-full max-w-[420px]">{children}</div>
          </div>
          {showHero ? (
            <div className="relative hidden min-h-[320px] overflow-hidden lg:m-4 lg:block lg:min-h-0 lg:rounded-[2rem]">
              <Image
                src={copy.imagePath}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 0vw, 50vw"
                priority
              />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-background p-4 shadow-lg">
                <p className="text-sm leading-relaxed text-foreground">{copy.heroCaption}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
