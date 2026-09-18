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
        <div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <Checkbox
            id={confirmId}
            checked={accepted}
            onCheckedChange={(value) => onAcceptedChange(value === true)}
          />
          <Label htmlFor={confirmId} className="text-sm leading-relaxed text-zinc-200">
            {confirmLabel}
          </Label>
        </div>
      ) : null}
    </div>
  );
}
