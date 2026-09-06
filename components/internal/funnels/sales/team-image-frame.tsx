import Image from "next/image";

import {
  TEAM_IMAGE_GRAIN_DATA_URI,
  TEAM_IMAGE_PRESET,
} from "@/lib/admin/funnels/team-image-preset";
import { TEAM_IMAGE_URL } from "@/lib/constants";

type TeamImageFrameProps = {
  alt?: string;
  priority?: boolean;
  sizes?: string;
};

export function TeamImageFrame({
  alt = "L'équipe Hercule",
  priority = true,
  sizes = "(max-width: 768px) 100vw, 1536px",
}: TeamImageFrameProps) {
  return (
    <div className={TEAM_IMAGE_PRESET.frameClass}>
      <Image
        src={TEAM_IMAGE_URL}
        alt={alt}
        fill
        unoptimized={false}
        quality={95}
        className={TEAM_IMAGE_PRESET.imageClass}
        sizes={sizes}
        priority={priority}
      />
      <div className={TEAM_IMAGE_PRESET.overlayClass} aria-hidden />
      <div className={TEAM_IMAGE_PRESET.vignetteClass} aria-hidden />
      <div
        className={TEAM_IMAGE_PRESET.grainClass}
        style={{
          backgroundImage: TEAM_IMAGE_GRAIN_DATA_URI,
          backgroundSize: "128px 128px",
        }}
        aria-hidden
      />
    </div>
  );
}
