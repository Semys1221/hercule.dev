"use client";

import { cn } from "@/lib/utils";

type SceneShellProps = {
  children: React.ReactNode;
  className?: string;
};

/** Fits the stage card to the displayed beat. */
export function SceneShell({ children, className }: SceneShellProps) {
  return (
    <div
      className={cn(
        "relative flex w-fit max-w-full items-center justify-center px-10 py-8",
        className,
      )}
    >
      <div data-scene-content className="relative flex w-fit max-w-full items-center justify-center">
        {children}
      </div>
    </div>
  );
}
