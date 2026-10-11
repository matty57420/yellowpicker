import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Modale accessible basée sur l'élément natif <dialog> (focus trap + Échap gérés par le navigateur). */
export function Modal({ open, title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="modal-title"
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-2xl border border-line bg-panel p-0 text-zinc-100"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id="modal-title" className="font-display text-2xl tracking-wide">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="rounded-md px-2 text-2xl leading-none text-muted hover:text-zinc-100"
        >
          ×
        </button>
      </div>
      <div className="p-5">{open && children}</div>
    </dialog>
  );
}
