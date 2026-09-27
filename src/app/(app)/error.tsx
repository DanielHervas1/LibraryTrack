"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex flex-col items-center gap-3 py-20 text-center">
      <h1 className="text-lg font-semibold">Algo ha fallado</h1>
      <p className="text-sm text-muted">Inténtalo de nuevo. Si sigue pasando, recarga la página.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
      >
        Reintentar
      </button>
    </section>
  );
}
