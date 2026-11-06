import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { driveButton } from '@/lib/drive';

export default function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previous; opener?.focus(); };
  }, []);
  return createPortal(<dialog ref={ref} aria-labelledby={id} className={`cpt-dialog ${wide ? 'cpt-dialog-wide' : ''} rounded-panel border border-line/30 bg-surface text-fg`}
    onCancel={e => { e.preventDefault(); e.stopPropagation(); close.current(); }}
    onKeyDown={e => { if (e.key === 'Escape') e.stopPropagation(); }}>
    <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line/20 bg-surface p-4">
      <h2 id={id} className="font-geist text-xl font-medium">{title}</h2>
      <button onClick={onClose} className={driveButton} aria-label={`Cerrar: ${title}`}><X size={18} aria-hidden="true" /><span className="hidden sm:inline">Cerrar</span></button>
    </div>
    <div className="p-4 sm:p-6">{children}</div>
  </dialog>, document.body);
}
