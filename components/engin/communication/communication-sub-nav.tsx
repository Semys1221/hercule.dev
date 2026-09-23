"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/communication/sequences", label: "Séquences" },
  { href: "/admin/communication/notifications", label: "Notifications" },
  { href: "/admin/communication/clients", label: "Inbox" },
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
    <header className="border-b border-border bg-card">
      <div className="flex flex-col gap-1 px-1 pb-0 pt-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Communication</h2>
        <p className="text-sm text-muted-foreground">
          Séquences Resend, notifications et messagerie clients (Gmail).
        </p>
      </div>
      <nav className="-mb-px flex gap-6 px-1" aria-label="Communication">
        {LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex items-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {link.label}
              {link.href.endsWith("/clients") && needsReply > 0 ? (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                  {needsReply}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
