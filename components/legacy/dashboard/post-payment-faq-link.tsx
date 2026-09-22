"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DASHBOARD_POST_PAYMENT_FAQ_LABEL } from "@/lib/legacy/dashboard/copy";

type PostPaymentFaqLinkProps = {
  href?: string;
  variant?: "button" | "link";
};

export function PostPaymentFaqLink({
  href = "/faq",
  variant = "button",
}: PostPaymentFaqLinkProps) {
  if (variant === "link") {
    return (
      <Link
        href={href}
        className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        {DASHBOARD_POST_PAYMENT_FAQ_LABEL}
      </Link>
    );
  }

  return (
    <div className="mt-4">
      <Button type="button" variant="outline" asChild>
        <Link href={href}>{DASHBOARD_POST_PAYMENT_FAQ_LABEL}</Link>
      </Button>
    </div>
  );
}
