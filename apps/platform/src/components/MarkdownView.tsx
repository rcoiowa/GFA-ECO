import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders trusted, in-repo markdown (the residence document library) with
 * house styling. Not for user-generated content.
 */
export function MarkdownView({ markdown }: { markdown: string }) {
  return (
    <div className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 text-2xl font-semibold text-ink">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-6 mb-2 text-xl font-semibold text-ink">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 mb-1 text-lg font-medium text-ink">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-3 leading-relaxed text-ink">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1 pl-6 text-ink">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1 pl-6 text-ink">{children}</ol>
          ),
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-line bg-surface-sunken px-3 py-2 text-left font-medium text-ink">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-line px-3 py-2 text-ink">{children}</td>
          ),
          hr: () => <hr className="my-5 border-line" />,
          em: ({ children }) => <em className="text-ink-muted">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-4 border-experience-600 pl-4 text-ink-muted">
              {children}
            </blockquote>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
