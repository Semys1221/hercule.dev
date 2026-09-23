import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import type { Niche } from "@/lib/legacy/admin/navigation";
import { sequenceMarkdownPath, sequencesDir } from "@/lib/legacy/legal-documentation/paths";
import {
  readResendSequenceFile,
  readSequenceFileAt,
  writeResendSequenceFile,
  writeSequenceFileAt,
  type SequenceFileDocument,
  type SequenceFileProvider,
  type SequenceFileStep,
} from "@/lib/(resend)/sequences/file-io";

export type { SequenceFileDocument, SequenceFileProvider, SequenceFileStep };

export function readSequenceFile(niche: Niche, slug: string): SequenceFileDocument | null {
  return (
    readResendSequenceFile(niche, slug) ??
    readSequenceFileAt(sequenceMarkdownPath(niche, slug), { niche, slug })
  );
}

export function writeSequenceFile(document: SequenceFileDocument): void {
  if (document.provider === "resend") {
    writeResendSequenceFile(document);
    return;
  }
  const path = sequenceMarkdownPath(document.niche, document.slug);
  mkdirSync(dirname(path), { recursive: true });
  mkdirSync(sequencesDir(document.niche), { recursive: true });
  writeSequenceFileAt(path, document);
}

export function sequenceFileRelativePath(niche: Niche, slug: string): string {
  if (readResendSequenceFile(niche, slug)) {
    return `lib/(resend)/sequences/content/${niche}/${slug}.md`;
  }
  return `app/(marketing)/content/legal-documentation/${niche}/sequences/${slug}.md`;
}
