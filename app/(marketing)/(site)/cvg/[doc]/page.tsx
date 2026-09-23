import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { LegalPageShell } from "@/components/site/legal-page-shell"
import { MarkdownDocument } from "@/components/site/markdown-document"
import {
  CVG_DOC_METADATA,
  getCvgDocMarkdown,
  isCvgDocSlug,
  type CvgDocSlug,
} from "@/lib/site/legal-content"

type CvgDocPageProps = {
  params: Promise<{ doc: string }>
}

export function generateStaticParams(): { doc: CvgDocSlug }[] {
  return Object.keys(CVG_DOC_METADATA).map((doc) => ({ doc: doc as CvgDocSlug }))
}

export async function generateMetadata({ params }: CvgDocPageProps): Promise<Metadata> {
  const { doc } = await params
  if (!isCvgDocSlug(doc)) {
    return { title: "Document introuvable — Hercule" }
  }
  const meta = CVG_DOC_METADATA[doc]
  return {
    title: `${meta.title} — Hercule`,
    description: meta.description,
  }
}

export default async function CvgDocPage({ params }: CvgDocPageProps) {
  const { doc } = await params
  if (!isCvgDocSlug(doc)) {
    notFound()
  }

  const content = getCvgDocMarkdown(doc)

  return (
    <LegalPageShell>
      <MarkdownDocument content={content} />
    </LegalPageShell>
  )
}
