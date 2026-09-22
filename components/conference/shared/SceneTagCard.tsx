"use client";

import { cn } from "@/lib/utils";

type SceneTagGridProps = {
  cols?: 2 | 3;
  children: React.ReactNode;
  className?: string;
};

export function SceneTagGrid({ cols = 3, children, className }: SceneTagGridProps) {
  const colClass =
    cols === 2 ? "grid-cols-[repeat(2,auto)]" : "grid-cols-[repeat(3,auto)]";

  return (
    <div className={cn("inline-grid w-fit max-w-full gap-2", colClass, className)}>
      {children}
    </div>
  );
}

type SceneTagCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function SceneTagCard({ children, className }: SceneTagCardProps) {
  return (
    <div
      className={cn(
        "rounded border border-zinc-800/70 px-3 py-1.5 text-center whitespace-nowrap",
        className,
      )}
    >
      {children}
    </div>
  );
}
