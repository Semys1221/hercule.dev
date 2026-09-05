"use client";

import { InternalResourceToolbar } from "@/components/internal/funnels/ui/internal-resource-toolbar";

const COMING_SOON = "à venir";

function disabledAction(reason: string) {
  return { enabled: false as const, reason };
}

type InternalLeafToolbarProps = {
  leafKey: string;
};

export function InternalLeafToolbar({ leafKey }: InternalLeafToolbarProps) {
  const isStub =
    leafKey === "dashboard" || leafKey.startsWith("emails_");

  if (!isStub) {
    return null;
  }

  return (
    <InternalResourceToolbar
      className="mb-6"
      edit={disabledAction(COMING_SOON)}
      preview={disabledAction(COMING_SOON)}
      promote={disabledAction(COMING_SOON)}
      delete={{
        ...disabledAction(COMING_SOON),
        confirmTitle: "Suppression indisponible",
        confirmDescription: COMING_SOON,
      }}
    />
  );
}
