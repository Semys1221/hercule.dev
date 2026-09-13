import { cn } from "@/lib/utils";

type InternalPageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function InternalPageShell({ children, className }: InternalPageShellProps) {
  return (
    <main className={cn("mx-auto max-w-[1400px] px-6 py-10", className)}>
      {children}
    </main>
  );
}
