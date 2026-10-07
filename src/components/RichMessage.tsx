import { lazy, Suspense, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, ExternalLink, Quote } from 'lucide-react';
import { polishGeneratedText } from '@/lib/editorialText';
const MathMarkdown = lazy(() => import('@/components/MathMarkdown'));

export default function RichMessage({ text, language }: { text: string; language?: 'ar' | 'en' }) {
  const polished = polishGeneratedText(text);
  const resolvedLanguage = language || (/[؀-ۿ]/.test(polished) ? 'ar' : 'en');
  const components: Components = {
        a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer">{children}<ExternalLink aria-hidden="true" /></a>,
        blockquote: ({ children }) => <blockquote><Quote aria-hidden="true" /> <div>{children}</div></blockquote>,
        code: ({ children, className, ...props }) => {
          const inline = !className && !String(children).includes('\n');
          return inline ? <code className="inline-code" {...props}>{children}</code> : <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>;
        },
        table: ({ children }) => <div className="table-scroll" tabIndex={0} role="region" aria-label={resolvedLanguage === 'ar' ? 'جدول قابل للتمرير' : 'Scrollable table'}><table>{children}</table></div>,
        hr: () => null,
      };
  const basic = <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{polished}</ReactMarkdown>;
  const hasMath = /\$[^$\n]+\$|\$\$[\s\S]+?\$\$/.test(polished);
  return <div className="prose-fahim" lang={resolvedLanguage} dir={resolvedLanguage === 'ar' ? 'rtl' : 'ltr'}>
    {hasMath ? <Suspense fallback={basic}><MathMarkdown text={polished} components={components} /></Suspense> : basic}
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
