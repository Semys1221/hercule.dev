"use client";

import type { ReactNode } from "react";
import { RubiksCube } from "./RubiksCube";
import { SceneLabel } from "./SceneLabel";

type ChapterDoorProps = {
  label: string;
  icon: ReactNode;
  labelSize?: "sm" | "xl";
};

/** Scrambled cube beside a bordered chapter card. Same layout as the bouche-à-oreille opener. */
export function ChapterDoor({ label, icon, labelSize = "sm" }: ChapterDoorProps) {
  return (
    <div className="flex items-center gap-14">
      <RubiksCube state="scrambled" size={72} spin={false} />
      <div className="flex flex-col gap-2 rounded border border-border px-6 py-4">
        {icon}
        <SceneLabel size={labelSize} animate={false}>
          {label}
        </SceneLabel>
      </div>
    </div>
  );
}
