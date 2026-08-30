import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Check, Copy } from 'lucide-react';
import 'katex/dist/katex.min.css';

export default function RichMessage({ text }: { text: string }) {
  return <div className="prose-fahim">
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
        code: ({ children, className, ...props }) => {
          const inline = !className && !String(children).includes('\n');
          return inline ? <code className="inline-code" {...props}>{children}</code> : <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>;
        },
        table: ({ children }) => <div className="table-scroll"><table>{children}</table></div>,
      }}
    >{text}</ReactMarkdown>
  </div>;
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('language-', '') || 'code';
  const copy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return <div className="code-shell">
    <div className="code-toolbar"><span>{language}</span><button type="button" onClick={copy}>{copied ? <Check /> : <Copy />}{copied ? 'Copied' : 'Copy'}</button></div>
    <pre><code className={className}>{children}</code></pre>
  </div>;
}
