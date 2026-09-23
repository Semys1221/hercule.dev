"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ClientCockpitData } from "@/lib/legacy/admin/clients/types";
import { CONFERENCE_INSCRIPTION_PATH } from "@/lib/legacy/payments/cabinet-checkout";

type CockpitPaymentLinkProps = {
  data: ClientCockpitData;
};

export function CockpitPaymentLink({ data }: CockpitPaymentLinkProps) {
  if (data.category !== "agence") return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paiement</CardTitle>
        <CardDescription>
          Souscription via la page conférence (Payment Links Stripe).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href={CONFERENCE_INSCRIPTION_PATH}>Ouvrir /conference/inscription</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
