import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Check, Copy, ExternalLink, Quote } from 'lucide-react';
import { polishGeneratedText } from '@/lib/editorialText';
import 'katex/dist/katex.min.css';

export default function RichMessage({ text, language }: { text: string; language?: 'ar' | 'en' }) {
  const polished = polishGeneratedText(text);
  const resolvedLanguage = language || (/[؀-ۿ]/.test(polished) ? 'ar' : 'en');
  return <div className="prose-fahim" lang={resolvedLanguage} dir={resolvedLanguage === 'ar' ? 'rtl' : 'ltr'}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer">{children}<ExternalLink aria-hidden="true" /></a>,
        blockquote: ({ children }) => <blockquote><Quote aria-hidden="true" /> <div>{children}</div></blockquote>,
        code: ({ children, className, ...props }) => {
          const inline = !className && !String(children).includes('\n');
          return inline ? <code className="inline-code" {...props}>{children}</code> : <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>;
        },
        table: ({ children }) => <div className="table-scroll" tabIndex={0} role="region" aria-label={resolvedLanguage === 'ar' ? 'جدول قابل للتمرير' : 'Scrollable table'}><table>{children}</table></div>,
        hr: () => null,
      }}
    >{polished}</ReactMarkdown>
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
  const arabic = document.documentElement.lang === 'ar';
  return <div className="code-shell" dir="ltr">
    <div className="code-toolbar"><span>{language}</span><button type="button" onClick={copy} aria-label={arabic ? 'نسخ الكود' : 'Copy code'}>{copied ? <Check /> : <Copy />}{copied ? (arabic ? 'تم النسخ' : 'Copied') : (arabic ? 'نسخ' : 'Copy')}</button></div>
    <pre><code className={className}>{children}</code></pre>
  </div>;
}
