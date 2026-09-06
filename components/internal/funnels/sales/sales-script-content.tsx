import type { ReactNode } from "react";

export function parseSalesScriptBold(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

type SalesScriptContentProps = {
  text: string;
};

export function SalesScriptContent({ text }: SalesScriptContentProps) {
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-4 text-left text-sm leading-relaxed text-foreground">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="whitespace-pre-wrap">
          {parseSalesScriptBold(paragraph)}
        </p>
      ))}
    </div>
  );
}
