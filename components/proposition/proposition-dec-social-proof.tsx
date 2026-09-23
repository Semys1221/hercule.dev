import Image from "next/image";

import { firmsByCategory } from "@/lib/conference/case-studies";

const COLUMNS = 4;

export function PropositionDecSocialProof() {
  const withLogo = firmsByCategory("accounting").filter((firm) => firm.logo.length > 0);
  const firms = withLogo.slice(0, Math.floor(withLogo.length / COLUMNS) * COLUMNS);

  return (
    <section className="flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
          Cabinets accompagnés
        </p>
        <h2 className="text-xl font-light tracking-tight text-foreground">
          Ils nous font confiance
        </h2>
      </div>

      {firms.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Les logos des cabinets accompagnés s&apos;affichent ici.
        </p>
      ) : (
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          {firms.map((firm) => (
            <div
              key={firm.slug}
              className="flex h-14 min-w-0 items-center justify-center rounded-md bg-card px-2"
            >
              <Image
                src={firm.logo}
                alt={firm.name}
                width={80}
                height={36}
                className="max-h-7 w-auto max-w-full object-contain"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
