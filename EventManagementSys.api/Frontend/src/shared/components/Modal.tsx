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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className={`fixed left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2 ${className}`}
    >
      {children}
    </div>
  );
}

export default Modal;
