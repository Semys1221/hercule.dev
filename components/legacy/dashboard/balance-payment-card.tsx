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
import type { DashboardData } from "@/lib/legacy/dashboard/types";
import { CONFERENCE_INSCRIPTION_PATH } from "@/lib/legacy/payments/cabinet-checkout";

type BalancePaymentCardProps = {
  data: DashboardData;
  onRefresh: () => void;
};

export function BalancePaymentCard({ data }: BalancePaymentCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Solde agence</CardTitle>
        <CardDescription>
          Les paiements 50/50 ne sont plus actifs. Pour une nouvelle souscription, utilisez la
          page conférence.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link href={CONFERENCE_INSCRIPTION_PATH}>Offres conférence</Link>
        </Button>
        {data.slug ? (
          <p className="mt-2 text-xs text-muted-foreground">Dossier : {data.slug}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
