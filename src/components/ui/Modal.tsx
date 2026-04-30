import { useEffect, type ReactNode } from 'react';
import './Modal.css';

type ModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ open, title, subtitle, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fl-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="fl-modal__panel" onClick={(e) => e.stopPropagation()}>
        <header className="fl-modal__head">
          <div>
            <h3 className="fl-modal__title">{title}</h3>
            {subtitle && <p className="fl-modal__sub">{subtitle}</p>}
          </div>
          <button className="fl-modal__close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="fl-modal__body">{children}</div>
      </div>
    </div>
  );
}
