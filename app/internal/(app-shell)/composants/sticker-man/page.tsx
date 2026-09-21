import { NotionStickerManDemo } from "@/components/sticker/notion-sticker-man-demo";
import { InternalPageHeader } from "@/components/internal/ui/internal-page-header";
import { InternalPageShell } from "@/components/internal/ui/internal-page-shell";
import {
  COMPONENTS_LABEL,
  INTERNAL_HOME_LABEL,
} from "@/lib/admin/funnels/ui-copy";
import { internalHomeHref } from "@/lib/admin/navigation";

export default function StickerManComponentsPage() {
  return (
    <InternalPageShell>
      <InternalPageHeader
        title="Sticker man"
        description="Sticker interactif Rive — chute, frappe clavier, regard caméra."
        segments={[
          { label: INTERNAL_HOME_LABEL, href: internalHomeHref() },
          { label: COMPONENTS_LABEL, href: "/internal/composants" },
          { label: "Sticker man" },
        ]}
      />
      <NotionStickerManDemo />
    </InternalPageShell>
  );
}
