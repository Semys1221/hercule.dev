import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type StepLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  confirmId: string;
  confirmLabel: string;
  accepted?: boolean;
  onAcceptedChange?: (accepted: boolean) => void;
  showCheckbox?: boolean;
};

export function StepLayout({
  title,
  subtitle,
  children,
  confirmId,
  confirmLabel,
  accepted = false,
  onAcceptedChange,
  showCheckbox = true,
}: StepLayoutProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">{title}</h1>
        <h2 className="text-base leading-relaxed text-zinc-300">{subtitle}</h2>
      </header>

      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-sm">
        {children}
      </div>

      {showCheckbox && onAcceptedChange ? (
        <Label
          htmlFor={confirmId}
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60 has-[[data-state=checked]]:border-indigo-500/40 has-[[data-state=checked]]:bg-indigo-500/5"
        >
          <Checkbox
            id={confirmId}
            checked={accepted}
            onCheckedChange={(value) => onAcceptedChange(value === true)}
          />
          <span className="text-sm leading-relaxed text-zinc-200">{confirmLabel}</span>
        </Label>
      ) : null}
    </div>
  );
}
