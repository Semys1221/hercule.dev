import Link from "next/link";

import { PostPaymentFaqLink } from "@/components/legacy/dashboard/post-payment-faq-link";

type TrackingSupportLinksProps = {
  contactEmail: string;
  upsellUrl: string;
  showFaqLink: boolean;
};

export function TrackingSupportLinks({
  contactEmail,
  upsellUrl,
  showFaqLink,
}: TrackingSupportLinksProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Une question ?{" "}
        <a
          href={`mailto:${contactEmail}`}
          className="text-foreground underline-offset-4 transition-colors hover:underline"
        >
          {contactEmail}
        </a>
      </p>
      <nav aria-label="Liens utiles" className="flex flex-col items-start gap-3">
        {showFaqLink ? <PostPaymentFaqLink href="#client-faq" variant="link" /> : null}
        <Link
          href={upsellUrl}
          className="text-sm font-medium text-foreground underline-offset-4 transition-colors hover:underline"
        >
          Renouveler ou changer de formule
        </Link>
      </nav>
    </div>
  );
}
