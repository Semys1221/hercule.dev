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
  moduleFromPathname,
  nicheFromPathname,
  sessionHubHref,
  type Niche,
} from "@/lib/admin/navigation";
import { writeStoredNiche } from "@/lib/admin/niche-storage";

function hrefForModule(module: string | null, niche: Niche, pathname: string): string {
  switch (module) {
    case "session":
      return sessionHubHref(niche);
    case "bookings":
      return bookingsHref(niche);
    case "clients":
      return clientsHubHref(niche);
    case "legal": {
      const legalDoc = pathname.match(
        /^\/internal\/funnels\/legal\/(?:agence|comptable|entreprise|cif)\/([^/]+)/,
      )?.[1];
      return legalDoc ? legalHref(niche, legalDoc as Parameters<typeof legalHref>[1]) : legalHref(niche);
    }
    case "emails": {
      const slug = pathname.match(
        /^\/internal\/funnels\/emails\/(?:agence|comptable|entreprise|cif)\/([^/]+)/,
      )?.[1];
      return slug ? emailsHref(niche, slug) : emailsHref(niche);
    }
    default:
      return sessionHubHref(niche);
  }
}

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
      className={cn("flex-wrap", className)}
      variant="outline"
      size="sm"
    >
      {ALL_NICHES.map((niche) => (
        <ToggleGroupItem key={niche} value={niche} aria-label={NICHE_LABELS[niche]}>
          {NICHE_LABELS[niche]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
