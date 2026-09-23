import { join } from "node:path";

import type { Niche } from "@/lib/legacy/admin/navigation";

export function resendSequencesRoot(): string {
  return join(process.cwd(), "lib", "(resend)", "sequences", "content");
}

export function resendSequenceMarkdownPath(niche: Niche, slug: string): string {
  return join(resendSequencesRoot(), niche, `${slug}.md`);
}

export function resendSequencesDir(niche: Niche): string {
  return join(resendSequencesRoot(), niche);
}

export function resendSequenceRelativePath(niche: Niche, slug: string): string {
  return `lib/(resend)/sequences/content/${niche}/${slug}.md`;
}
