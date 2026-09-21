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

export function ClientUpsellCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Renouveler ou changer de formule</CardTitle>
        <CardDescription>
          Pack, abonnement mensuel ou autre vertical — repassez par la page paiement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link href="/conference/payment">Voir les formules</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
