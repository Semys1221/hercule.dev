"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/communication/sequences", label: "Séquences" },
  { href: "/admin/communication/notifications", label: "Notifications" },
  { href: "/admin/communication/clients", label: "Clients" },
] as const;

export function CommunicationSubNav() {
  const pathname = usePathname();
  const [needsReply, setNeedsReply] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/admin/engin/communication/clients/counts");
        if (!response.ok) return;
        const payload = (await response.json()) as { needsReply?: number };
        if (!cancelled) setNeedsReply(payload.needsReply ?? 0);
      } catch {
        // ignore — tables may not exist yet
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
      {LINKS.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {link.label}
            {link.href.endsWith("/clients") && needsReply > 0 ? (
              <Badge variant="destructive">{needsReply}</Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
