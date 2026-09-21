"use client";

import { usePathname, useRouter } from "next/navigation";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  ALL_NICHES,
  NICHE_LABELS,
  bookingsHref,
  clientsHubHref,
  emailsHref,
  legalHref,
  managementHref,
  moduleFromPathname,
  nicheFromPathname,
  sessionHubHref,
  type Niche,
} from "@/lib/legacy/admin/navigation";
import { writeStoredNiche } from "@/lib/legacy/admin/niche-storage";

function hrefForModule(module: string | null, niche: Niche, pathname: string): string {
  switch (module) {
    case "session":
      return sessionHubHref(niche);
    case "bookings":
      return bookingsHref(niche);
    case "clients":
      return clientsHubHref(niche);
    case "management":
      return managementHref(niche);
    case "legal":
      return legalHref(niche);
    case "emails":
      return emailsHref(niche);
    default:
      return sessionHubHref(niche);
  }
}

/** Compact labels for the toggle group — full names stay in aria-label. */
const NICHE_SWITCHER_LABELS: Record<Niche, string> = {
  agence: "Agence",
  entreprise: "Leads",
  comptable: "Comptable",
  cif: "CIF",
  jum: "JUM",
};

type NicheSwitcherProps = {
  className?: string;
};

export function NicheSwitcher({ className }: NicheSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentNiche = nicheFromPathname(pathname);
  const module = moduleFromPathname(pathname);

  function onNicheChange(value: string) {
    if (!value || value === currentNiche) {
      return;
    }
    const niche = value as Niche;
    writeStoredNiche(niche);
    router.push(hrefForModule(module, niche, pathname));
  }

  return (
    <ToggleGroup
      type="single"
      value={currentNiche}
      onValueChange={onNicheChange}
      className={cn("flex w-full max-w-full flex-wrap gap-1", className)}
      variant="outline"
      size="sm"
    >
      {ALL_NICHES.map((niche) => (
        <ToggleGroupItem
          key={niche}
          value={niche}
          aria-label={NICHE_LABELS[niche]}
          className="min-w-fit flex-none shrink-0 px-2.5"
        >
          {NICHE_SWITCHER_LABELS[niche]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
