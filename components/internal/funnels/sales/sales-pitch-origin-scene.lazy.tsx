"use client";

import dynamic from "next/dynamic";

import type { Audience } from "@/lib/admin/navigation";

import { CompanyOriginTimeline } from "./company-origin-timeline";

function OriginSceneLoading({ audience }: { audience: Audience }) {
  return (
    <div className="space-y-4">
      <div className="aspect-[16/9] w-full animate-pulse rounded-2xl border border-border bg-muted/30" />
      <CompanyOriginTimeline audience={audience} />
    </div>
  );
}

const SalesPitchOriginScene = dynamic(
  () =>
    import("./sales-pitch-origin-scene").then((module) => ({
      default: module.SalesPitchOriginScene,
    })),
  {
    ssr: false,
    loading: () => <OriginSceneLoading audience="comptable" />,
  },
);

type SalesPitchOriginSceneLazyProps = {
  audience: Audience;
};

export function SalesPitchOriginSceneLazy({ audience }: SalesPitchOriginSceneLazyProps) {
  return <SalesPitchOriginScene audience={audience} />;
}
