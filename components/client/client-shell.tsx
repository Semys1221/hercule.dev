import type { ReactNode } from "react";

import { ClientHeader } from "./client-header";

type ClientShellProps = {
  children: ReactNode;
};

export function ClientShell({ children }: ClientShellProps) {
  return (
    <div className="internal flex min-h-screen flex-col bg-background text-foreground">
      <ClientHeader />
      <main className="flex flex-1 flex-col px-6 py-8">{children}</main>
    </div>
  );
}
