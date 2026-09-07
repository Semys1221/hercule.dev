"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DASHBOARD_POST_PAYMENT_FAQ_LABEL } from "@/lib/dashboard/copy";

export function PostPaymentFaqLink() {
  return (
    <div className="mt-4">
      <Button type="button" variant="outline" asChild>
        <Link href="/faq">{DASHBOARD_POST_PAYMENT_FAQ_LABEL}</Link>
      </Button>
    </div>
  );
}
