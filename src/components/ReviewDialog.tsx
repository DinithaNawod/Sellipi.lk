import { useEffect, useRef, useId, type ReactNode, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

export default function ReviewDialog({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const dialog = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLElement>('textarea, input, select, button')?.focus();
    return () => previous?.focus();
  }, []);
  function keys(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && !busy) onClose();
    if (event.key !== 'Tab') return;
    const fields = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]');
    if (!fields?.length) { event.preventDefault(); return; }
    const first = fields[0], last = fields[fields.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return <div className="dialog-backdrop" onClick={() => { if (!busy) onClose(); }}><section ref={dialog} className="review-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} onClick={event => event.stopPropagation()} onKeyDown={keys}><button className="icon-button dialog-close" aria-label="Close dialog" disabled={busy} onClick={onClose}><X /></button><h2 id={titleId}>{title}</h2>{children}</section></div>;
}
