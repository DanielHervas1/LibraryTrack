import type { Metadata } from "next";

import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata: Metadata = {
  title: "Sin conexión",
};

/** El service worker sirve esta página cuando no hay red y la ruta no está cacheada. */
export default function OfflinePage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
      <ThemeToggle className="absolute top-3 right-3" />
      <h1 className="text-lg font-semibold">Sin conexión</h1>
      <p className="text-sm text-muted">
        No se puede cargar esta página sin internet. Cuando vuelvas a tener conexión, se cargará con
        normalidad.
      </p>
    </main>
  );
}
