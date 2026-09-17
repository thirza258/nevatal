import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Shared formatting for live and saved answers, including tables and code. */
export default function MarkdownContent({ text }: { text: string }) {
  let json: string | undefined;
  if (/^\s*(?:\[|\{)/.test(text)) {
    try { json = JSON.stringify(JSON.parse(text), null, 2); } catch { /* Markdown or plain text. */ }
  }

  return (
    <div className="prose prose-sm max-w-none min-w-0 break-words prose-pre:max-w-full prose-pre:overflow-x-auto prose-pre:whitespace-pre prose-code:break-words">
      {json ? (
        <pre><code>{json}</code></pre>
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({ children }) => <div className="max-w-full overflow-x-auto"><table>{children}</table></div>,
          }}
        >
          {text}
        </ReactMarkdown>
      )}
    </div>
  );
}
