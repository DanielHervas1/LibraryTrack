import type { Metadata } from "next";
import { headers } from "next/headers";

import { PasswordForm } from "@/components/auth/password-form";
import { MinutesPerPageForm } from "@/components/settings/minutes-per-page-form";
import { ShareSettings } from "@/components/settings/share-settings";
import { signOut } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth/session";
import { getProfile } from "@/lib/db/profile";

export const metadata: Metadata = {
  title: "Ajustes",
};

const linkClass = "rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  // Origen real de la petición (Vercel o localhost), para construir el enlace compartido.
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <h1 className="text-xl font-semibold">Ajustes</h1>

      <section id="password" className="flex scroll-mt-6 flex-col gap-3">
        <div>
          <h2 className="font-medium">Contraseña</h2>
          <p className="mt-1 text-sm text-muted">
            Crea o cambia la contraseña con la que entras en la app (también dentro de la app
            instalada en el móvil).
          </p>
        </div>
        <PasswordForm email={user.email} />
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <div>
          <h2 className="font-medium">Estadísticas</h2>
          <p className="mt-1 text-sm text-muted">
            Las horas de lectura se estiman con las páginas leídas. Ajusta a tu ritmo (una novela
            suele ir a 1-2 minutos por página).
          </p>
        </div>
        <MinutesPerPageForm value={profile.minutesPerPage} />
      </section>

      <section id="share" className="flex scroll-mt-6 flex-col gap-3 border-t border-border pt-6">
        <div>
          <h2 className="font-medium">Perfil compartido</h2>
          <p className="mt-1 text-sm text-muted">
            Un enlace secreto para que un amigo vea tu colección sin poder editar nada. No aparece
            en buscadores y puedes desactivarlo o cambiarlo cuando quieras. Las entradas marcadas
            como privadas nunca se muestran.
          </p>
        </div>
        <ShareSettings
          baseUrl={baseUrl}
          shareToken={profile.shareToken}
          displayName={profile.displayName}
          hideReviews={profile.shareHideReviews}
        />
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
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
