import type { Language } from '@/App';

type FahimBrandProps = {
  language?: Language;
  compact?: boolean;
  descriptor?: boolean;
  className?: string;
  onDark?: boolean;
};

/** Canonical responsive lockup for Fahim Brand Identity V3.2. */
export default function FahimBrand({
  language = 'ar',
  compact = false,
  descriptor = true,
  className = '',
  onDark = false,
}: FahimBrandProps) {
  const arabic = language === 'ar';
  const label = arabic ? 'فَهيم، الفهم الذي يمكنك إثباته' : 'Fahim AI, verified learning';

  return (
    <span
      className={`fahim-v32-lockup ${compact ? 'is-compact' : ''} ${onDark ? 'on-dark' : ''} ${className}`.trim()}
      aria-label={label}
    >
      <span className="fahim-v32-symbol" aria-hidden="true">
        <img src="/brand/fahim-symbol-v32.png" alt="" width="1254" height="1254" decoding="async" />
      </span>
      {!compact && (
        <span className="fahim-v32-copy">
          <strong lang={arabic ? 'ar' : 'en'}>{arabic ? 'فَهيم' : <>Fahim<span>AI</span></>}</strong>
          {descriptor && <small>{arabic ? 'الفهم الذي يمكنك إثباته' : 'Verified learning'}</small>}
        </span>
      )}
    </span>
  );
}
