import { Badge } from "@/components/ui/badge";
import type { DeliverabilityHealth } from "@/lib/admin/deliverability/types";

const LABELS: Record<DeliverabilityHealth, string> = {
  healthy: "Sain",
  watch: "Surveillance",
  critical: "Critique",
  paused: "En pause",
  error: "Erreur",
  no_warmup: "Sans warmup",
};

const VARIANTS: Record<
  DeliverabilityHealth,
  "default" | "secondary" | "destructive" | "outline"
> = {
  healthy: "default",
  watch: "secondary",
  critical: "destructive",
  paused: "outline",
  error: "destructive",
  no_warmup: "outline",
};

export function DeliverabilityHealthBadge({ health }: { health: DeliverabilityHealth }) {
  return <Badge variant={VARIANTS[health]}>{LABELS[health]}</Badge>;
}
