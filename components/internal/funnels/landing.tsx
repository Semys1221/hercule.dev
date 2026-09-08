import Link from "next/link";

import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AUDIENCE_CAPTIONS,
  AUDIENCE_ICONS,
  AUDIENCE_LABELS,
  sessionHubHref,
  type Audience,
} from "@/lib/admin/navigation";
import { LANDING_DESCRIPTION, PRODUCT_ROOT_LABEL } from "@/lib/admin/funnels/ui-copy";

const AUDIENCES: Audience[] = ["agence", "entreprise", "comptable"];

export function FunnelLanding() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <InternalPageHeader
        title={PRODUCT_ROOT_LABEL}
        description={LANDING_DESCRIPTION}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {AUDIENCES.map((audience) => (
          <Card key={audience}>
            <CardHeader>
              <CardTitle>
                {AUDIENCE_ICONS[audience]} {AUDIENCE_LABELS[audience]}
              </CardTitle>
              <CardDescription>{AUDIENCE_CAPTIONS[audience]}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={sessionHubHref(audience)}>
                  Ouvrir {AUDIENCE_LABELS[audience]}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
