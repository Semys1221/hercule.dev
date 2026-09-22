import { Badge } from "@/components/ui/badge";
import {
  formatTrackingDate,
  formatTrackingTime,
  type TrackingScan,
} from "@/lib/clients/tracking/script";
import { cn } from "@/lib/utils";

const BADGE_ACTIVE = "border-tracking-border bg-tracking-muted text-tracking";
const BADGE_IDLE = "border-border/50 bg-transparent text-muted-foreground";

type TrackingLogProps = {
  scans: TrackingScan[];
};

export function TrackingLog({ scans }: TrackingLogProps) {
  const activeStation = scans[0]?.station;

  return (
    <section aria-labelledby="tracking-log-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="tracking-log-title" className="text-base font-semibold">
          Journal
        </h2>
        <p className="text-sm text-muted-foreground">
          Détail du déploiement, du plus récent au plus ancien.
        </p>
      </div>
      <ol className="flex flex-col">
        {scans.map((scan, index) => (
          <li
            key={scan.id}
            className={cn(
              "flex flex-col gap-2 border-b border-l-2 border-border/40 py-4 pl-3 first:pt-0 last:border-b-0 sm:flex-row sm:items-start sm:gap-6",
              index === 0 ? "border-l-tracking" : "border-l-transparent",
            )}
            style={
              index >= 8
                ? { contentVisibility: "auto", containIntrinsicSize: "auto 4rem" }
                : undefined
            }
          >
            <div className="flex shrink-0 items-center gap-3 sm:w-36">
              <time
                dateTime={scan.at.toISOString()}
                className="text-sm tabular-nums text-muted-foreground"
              >
                {formatTrackingDate(scan.at)}
              </time>
              <span className="text-sm tabular-nums text-muted-foreground/70">
                {formatTrackingTime(scan.at)}
              </span>
            </div>
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">
              {scan.situation}
            </p>
            <Badge
              variant="outline"
              className={cn(
                "w-fit shrink-0 text-xs font-normal",
                scan.station === activeStation ? BADGE_ACTIVE : BADGE_IDLE,
              )}
            >
              {scan.stationLabel}
            </Badge>
          </li>
        ))}
      </ol>
    </section>
  );
}
