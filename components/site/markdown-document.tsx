import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-3xl md:text-4xl text-white font-medium tracking-tight mb-8">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-xl text-white font-medium tracking-tight mt-10 mb-4">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-lg text-white font-medium mt-8 mb-3">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-zinc-400 text-sm leading-relaxed mb-4">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-inside space-y-2 text-zinc-400 text-sm mb-4 ml-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal list-inside space-y-2 text-zinc-400 text-sm mb-4 ml-1">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="text-zinc-200 font-medium">{children}</strong>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-zinc-700 pl-4 text-zinc-500 text-sm mb-4">{children}</blockquote>
  ),
  hr: () => <hr className="border-zinc-800 my-8" />,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm text-left border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => <thead className="border-b border-zinc-700">{children}</thead>,
  tbody: ({ children }: { children?: React.ReactNode }) => <tbody>{children}</tbody>,
  tr: ({ children }: { children?: React.ReactNode }) => <tr className="border-b border-zinc-800/80">{children}</tr>,
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="py-2 pr-4 text-zinc-300 font-medium align-top">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="py-2 pr-4 text-zinc-400 align-top">{children}</td>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="text-zinc-200 underline underline-offset-2 hover:text-white transition-colors">
      {children}
    </a>
  ),
}

export function MarkdownDocument({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  )
}
