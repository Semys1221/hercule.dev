"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

import { HerculeMark } from "@/components/hercule-mark";
import { StepLayout } from "@/components/proposition/steps/step-layout";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type PaymentStepProps = {
  stripePaymentLinkUrl: string;
  allValidated: boolean;
};

export function PaymentStep({ stripePaymentLinkUrl, allValidated }: PaymentStepProps) {
  const [copyError, setCopyError] = useState(false);

  const handleCopy = useCallback(async () => {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(stripePaymentLinkUrl);
      toast({
        title: "Lien copié",
        description: stripePaymentLinkUrl,
      });
    } catch {
      setCopyError(true);
      toast({
        title: "Copie impossible",
        description: "Copiez le lien manuellement ci-dessous.",
        variant: "destructive",
      });
    }
  }, [stripePaymentLinkUrl]);

  return (
    <StepLayout
      title="Finalisation"
      subtitle="Tous les blocs ont été validés. Le lien de paiement est prêt à être partagé."
      confirmId="payment-copy"
      confirmLabel=""
      showCheckbox={false}
    >
      <div className="flex flex-col items-center gap-6 py-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="relative flex size-20 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10"
        >
          <HerculeMark className="size-8 text-zinc-100" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
            className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-indigo-500"
          >
            <Check className="size-4 text-white" aria-hidden />
          </motion.div>
        </motion.div>

        <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-sm text-zinc-400">Lien de paiement Stripe</p>
          <p className="mt-2 break-all font-mono text-sm text-zinc-200">{stripePaymentLinkUrl}</p>
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full sm:w-auto"
          disabled={!allValidated}
          onClick={() => void handleCopy()}
        >
          <Copy className="size-4" aria-hidden />
          Copier le lien de paiement
        </Button>

        {!allValidated ? (
          <p className="text-sm text-zinc-500">
            Validez tous les blocs de la proposition avant de copier le lien.
          </p>
        ) : null}

        {copyError ? (
          <p className="text-sm text-destructive">
            La copie automatique a échoué — utilisez le lien affiché ci-dessus.
          </p>
        ) : null}
      </div>
    </StepLayout>
  );
}
