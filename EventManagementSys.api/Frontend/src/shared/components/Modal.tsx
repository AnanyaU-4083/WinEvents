import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  ariaLabel: string;
  className?: string;
  children: ReactNode;
}

function Modal({ open, ariaLabel, className = '', children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={className}
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.58)', backdropFilter: 'blur(16px)' }}
      >
        {children}
      </div>
    </div>
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
