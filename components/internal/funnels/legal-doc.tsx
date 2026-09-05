import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type FunnelLegalDocProps = {
  label: string;
  markdown: string;
};

export function FunnelLegalDoc({ label, markdown }: FunnelLegalDocProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Aperçu lecture seule. L&apos;édition écrira dans <code>doc/tech-stack/</code> et
        synchronisera le site (P2).
      </p>
      <div className="rounded-lg border bg-muted/30 p-6">
        <h2 className="mb-4 text-lg font-semibold">{label}</h2>
        <div className="prose prose-neutral max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
