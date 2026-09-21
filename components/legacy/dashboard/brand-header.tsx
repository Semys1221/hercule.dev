"use client";

import { HerculeMark } from "@/components/hercule-mark";
import { Separator } from "@/components/ui/separator";

export function DashboardBrandHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center border-b border-border bg-background px-6">
      <HerculeMark variant="dual" className="size-5 text-white" />
      <span className="ml-2 text-sm font-semibold">Hercule</span>
      <div className="ml-auto">
        <a
          href="mailto:contact@hercule.dev"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Aide
        </a>
      </div>
    </header>
  );
}

type DashboardPageHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
};

export function DashboardPageHeader({ eyebrow, title, subtitle }: DashboardPageHeaderProps) {
  return (
    <div className="mb-8">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {eyebrow}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
      <Separator className="mt-6" />
    </div>
  );
}
