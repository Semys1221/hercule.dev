import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SESSION_OPEN_CTA } from "@/lib/legacy/admin/funnels/ui-copy";
import { salesFunnelHref, type Audience } from "@/lib/legacy/admin/navigation";

type SalesHubLandingProps = {
  audience: Audience;
};

export function SalesHubLanding({ audience }: SalesHubLandingProps) {
  const funnelHref = salesFunnelHref(audience);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-center">
      <Button asChild size="lg">
        <Link href={funnelHref}>{SESSION_OPEN_CTA}</Link>
      </Button>
    </div>
  );
}
