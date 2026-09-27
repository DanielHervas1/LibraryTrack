"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Modal de ruta (parallel + intercepting routes). Cerrar = volver atrás en el historial,
 * así la URL y el botón "atrás" del navegador/móvil se comportan como se espera.
 * Usa <dialog> nativo: gestiona el foco, Escape y la capa superior.
 */
export function Modal({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function close() {
    router.back();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        // Clic en el fondo (fuera del contenido) cierra.
        if (event.target === dialogRef.current) close();
      }}
      className="m-auto h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-backdrop sm:h-auto sm:max-h-[90vh] sm:max-w-4xl"
    >
      <div className="relative h-full overflow-y-auto bg-background p-4 pt-14 text-foreground sm:max-h-[90vh] sm:rounded-2xl sm:p-6 sm:pt-14">
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full text-xl text-muted hover:bg-surface hover:text-foreground"
        >
          ×
        </button>
        {children}
      </div>
    </dialog>
  );
}
