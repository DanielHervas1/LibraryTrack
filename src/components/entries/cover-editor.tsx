"use client";

import { useRef, useState, useTransition } from "react";

import { resetCover, setCustomCover } from "@/lib/actions/entries";
import { COVER_BUCKET, COVER_MAX_BYTES, COVER_MIME_TYPES } from "@/lib/constants";
import { createClient } from "@/lib/db/client";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type CoverEditorProps = {
  entryId: string;
  userId: string;
  /** La portada actual es una subida a mano (se puede volver a la del proveedor). */
  isCustom: boolean;
  hasProviderCover: boolean;
};

/**
 * Sube la imagen directamente a Supabase Storage (covers/<user>/<entry>/) con la sesión
 * del usuario; el servidor solo valida la URL resultante y la guarda.
 */
export function CoverEditor({ entryId, userId, isCustom, hasProviderCover }: CoverEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!COVER_MIME_TYPES.includes(file.type)) {
      setError("Formato no válido. Usa JPG, PNG o WebP.");
      return;
    }
    if (file.size > COVER_MAX_BYTES) {
      setError("La imagen supera 5 MB.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const path = `${userId}/${entryId}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
      const upload = await supabase.storage
        .from(COVER_BUCKET)
        .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
      if (upload.error) {
        console.error(upload.error);
        setError("No se pudo subir la imagen.");
        return;
      }

      const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
      const result = await setCustomCover(entryId, data.publicUrl);
      if (result.status === "error") {
        await supabase.storage.from(COVER_BUCKET).remove([path]);
        setError(result.message);
      }
    });
  }

  function handleReset() {
    setError(null);
    startTransition(async () => {
      const result = await resetCover(entryId);
      if (result.status === "error") setError(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={COVER_MIME_TYPES.join(",")}
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="text-accent hover:underline disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Cambiar portada"}
        </button>
        {isCustom && (
          <button
            type="button"
            disabled={pending}
            onClick={handleReset}
            className="text-muted hover:text-foreground disabled:opacity-60"
          >
            {hasProviderCover ? "Usar la original" : "Quitar portada"}
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
