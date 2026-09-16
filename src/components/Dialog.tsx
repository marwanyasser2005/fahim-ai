import { useEffect, useRef, type ReactNode } from 'react';

/**
 * One accessible modal primitive for the whole product.
 *
 * Before this, each overlay implemented its own subset: `role="dialog"` and Escape were
 * present in some, focus was never trapped or restored anywhere, and the profile editor
 * could not be dismissed with the keyboard at all. `tabIndex` was not used once in the
 * codebase, so nothing could receive focus programmatically.
 */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible name. Required: an unlabelled dialog is unusable with a screen reader. */
  label: string;
  children: ReactNode;
  /** Extra classes for the panel itself. */
  className?: string;
  /** Skip the backdrop wash when the caller already provides its own. */
  backdropClassName?: string;
};

export default function Dialog({ open, onClose, label, children, className = '', backdropClassName = 'bg-slate-950/55 backdrop-blur-sm' }: DialogProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (!panel) return;

    // Move focus into the dialog so keyboard and screen-reader users land inside it.
    const first = panel.querySelector<HTMLElement>(FOCUSABLE);
    (first || panel).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const firstItem = focusable[0];
      const lastItem = focusable[focusable.length - 1];
      if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      } else if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
      // Return focus to whatever opened the dialog.
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return <div className={`fixed inset-0 z-[90] grid place-items-center p-4 ${backdropClassName}`} role="dialog" aria-modal="true" aria-label={label}>
    <div ref={panelRef} tabIndex={-1} className={`outline-none ${className}`}>{children}</div>
  </div>;
}
