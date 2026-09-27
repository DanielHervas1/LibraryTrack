"use client";

import { useActionState, useState, useTransition } from "react";

import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/styles";
import type { ActionState } from "@/lib/actions/entries";
import { disableShareLink, regenerateShareLink, updateShareSettings } from "@/lib/actions/profile";

const initialState: ActionState = { status: "idle" };

type ShareSettingsProps = {
  /** Origen de la app (https://library-track.vercel.app o http://localhost:3000). */
  baseUrl: string;
  shareToken: string | null;
  displayName: string | null;
  hideReviews: boolean;
};

export function ShareSettings({
  baseUrl,
  shareToken,
  displayName,
  hideReviews,
}: ShareSettingsProps) {
  const [state, formAction, saving] = useActionState(updateShareSettings, initialState);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const url = shareToken ? `${baseUrl}/share/${shareToken}` : null;

  function run(action: () => Promise<ActionState>, done: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setMessage(result.status === "error" ? result.message : done);
    });
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Enlace copiado ✓");
    } catch {
      setMessage("No se pudo copiar; selecciónalo y cópialo a mano.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {shareToken ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="share-url" className="text-sm font-medium">
            Tu enlace
          </label>
          <div className="flex gap-2">
            <input
              id="share-url"
              readOnly
              value={url ?? ""}
              onFocus={(event) => event.target.select()}
              className={`${inputClass} text-sm`}
            />
            <button type="button" onClick={copy} className={secondaryButtonClass}>
              Copiar
            </button>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                Ver como lo verá tu amigo
              </a>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (window.confirm("¿Crear un enlace nuevo? El actual dejará de funcionar.")) {
                  run(regenerateShareLink, "Enlace nuevo creado ✓");
                }
              }}
              className="text-muted hover:text-foreground disabled:opacity-60"
            >
              Generar otro enlace
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(disableShareLink, "Perfil compartido desactivado")}
              className="text-danger hover:underline disabled:opacity-60"
            >
              Desactivar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(regenerateShareLink, "Enlace creado ✓")}
          className={`${primaryButtonClass} self-start`}
        >
          {pending ? "Creando…" : "Crear enlace para compartir"}
        </button>
      )}

      <form action={formAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Nombre que verá tu amigo</span>
          <input
            name="display_name"
            defaultValue={displayName ?? ""}
            maxLength={60}
            placeholder="Por ejemplo, tu nombre"
            className={inputClass}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="share_hide_reviews"
            defaultChecked={hideReviews}
            className="accent-[var(--accent)]"
          />
          Ocultar mis opiniones (solo se verán títulos, notas y estados)
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className={secondaryButtonClass}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <span aria-live="polite" className="text-sm">
            {!saving && state.status === "saved" && <span className="text-muted">Guardado ✓</span>}
            {!saving && state.status === "error" && (
              <span className="text-danger">{state.message}</span>
            )}
          </span>
        </div>
      </form>

      {message && (
        <p className="text-sm text-muted" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
