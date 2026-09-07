"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DashboardData } from "@/lib/dashboard/types";

import { OnboardingFormFields } from "./onboarding-form-fields";

type OnboardingFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  data: DashboardData;
  onSuccess: () => void;
};

export function OnboardingFormModal({
  open,
  onOpenChange,
  slug,
  data,
  onSuccess,
}: OnboardingFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Compléter votre onboarding</DialogTitle>
          <DialogDescription>
            Ces informations permettent à Hercule de calibrer la recherche de contrats.
          </DialogDescription>
        </DialogHeader>

        <OnboardingFormFields
          mode="live"
          slug={slug}
          data={data}
          onSuccess={() => {
            onOpenChange(false);
            onSuccess();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
