// Provide a shared dialog container.
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  ariaLabel: string;
  className?: string;
  onClose?: () => void;
  children: ReactNode;
}

function Modal({ open, ariaLabel, className = '', onClose, children }: ModalProps) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-slate-950/10 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={className + ' glass-popup relative'}
      >
        {onClose && (
          <button
            type="button"
            aria-label={'Close ' + ariaLabel.toLowerCase() + ' dialog'}
            onClick={onClose}
            className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full text-2xl leading-none text-text-secondary transition hover:bg-surface-subtle hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            &times;
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
interface FeedbackModalProps {
  open: boolean;
  title: string;
  message: string;
  tone?: 'success' | 'error';
  onClose: () => void;
}

export function FeedbackModal({
  open,
  title,
  message,
  tone = 'success',
  onClose,
}: FeedbackModalProps) {
  if (!open) return null;

  const isError = tone === 'error';

  return (
    <Modal
      open={open}
      ariaLabel={title}
      className="w-full max-w-md rounded-2xl border border-border-accent/40 bg-white p-6 shadow-2xl"
      onClose={onClose}
    >
      <div
        className={`mb-4 grid h-11 w-11 place-items-center rounded-full text-xl font-bold ${
          isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}
        aria-hidden="true"
      >
        {isError ? '!' : '\u2713'}
      </div>
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <p className="mt-2 text-sm text-text-secondary">{message}</p>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary-hover"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

export default Modal;
