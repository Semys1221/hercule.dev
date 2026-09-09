"use client";

import Link from "next/link";
import { Fragment } from "react";

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

type FaqRichTextProps = {
  text: string;
  className?: string;
};

export function FaqRichText({ text, className }: FaqRichTextProps) {
  const parts: Array<{ type: "text"; value: string } | { type: "link"; label: string; href: string }> =
    [];
  let lastIndex = 0;

  for (const match of text.matchAll(LINK_PATTERN)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, matchIndex) });
    }
    parts.push({ type: "link", label: match[1], href: match[2] });
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === "text") {
          return <Fragment key={`text-${index}`}>{part.value}</Fragment>;
        }

        const isInternal = part.href.startsWith("/");
        if (isInternal) {
          return (
            <Link
              key={`link-${index}`}
              href={part.href}
              className="text-foreground underline underline-offset-2 hover:no-underline"
            >
              {part.label}
            </Link>
          );
        }

        return (
          <a
            key={`link-${index}`}
            href={part.href}
            className="text-foreground underline underline-offset-2 hover:no-underline"
          >
            {part.label}
          </a>
        );
      })}
    </span>
  );
}
