import type { Metadata } from "next";

import { signOut } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Ajustes",
};

const linkClass = "rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <h1 className="text-xl font-semibold">Ajustes</h1>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-medium">Exportar mis datos</h2>
          <p className="mt-1 text-sm text-muted">
            Descarga todo tu catálogo para tener una copia fuera de la app. El JSON incluye todos
            los campos; el CSV se abre en Excel o Google Sheets.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Enlaces normales (no <Link>): son descargas, no navegación. */}
          <a href="/api/export?format=json" download className={linkClass}>
            Descargar JSON
          </a>
          <a href="/api/export?format=csv" download className={linkClass}>
            Descargar CSV
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <div>
          <h2 className="font-medium">Cuenta</h2>
          <p className="mt-1 text-sm text-muted">Sesión iniciada como {user.email}</p>
        </div>
        <form action={signOut}>
          <button type="submit" className={linkClass}>
            Cerrar sesión
          </button>
        </form>
      </section>
    </div>
  );
}
