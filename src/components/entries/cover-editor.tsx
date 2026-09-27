"use client";

import { useRef, useState, useTransition } from "react";

import { resetCover } from "@/lib/actions/entries";
import { COVER_MIME_TYPES } from "@/lib/constants";
import { uploadCover } from "@/lib/storage/upload-cover";

type CoverEditorProps = {
  entryId: string;
  userId: string;
  /** La portada actual es una subida a mano (se puede volver a la del proveedor). */
  isCustom: boolean;
  hasProviderCover: boolean;
};

export function CoverEditor({ entryId, userId, isCustom, hasProviderCover }: CoverEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    startTransition(async () => {
      setError(await uploadCover(entryId, userId, file));
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
