import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/format';
import { IconButton } from './Button';
import { XIcon } from '@/components/icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
}

/**
 * Bottom sheet on mobile, centered dialog on desktop.
 * Enter only: fade the scrim, rise + scale the panel with the sheet curve.
 */
export function Modal({ open, onClose, title, subtitle, children, maxWidth = '38rem' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full animate-scale-in rounded-t-3xl bg-surface shadow-float
          max-h-[calc(100dvh-2rem)] overflow-y-auto sm:rounded-3xl"
        style={{ maxWidth }}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-surface px-6 pb-3 pt-5">
          <div>
            <h2 className="text-[17px] font-semibold leading-snug text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-ink-2">{subtitle}</p>}
          </div>
          <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1 shrink-0">
            <XIcon className="h-5 w-5" />
          </IconButton>
        </div>
        <div className={cn('px-6 pb-6 pt-1')}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
