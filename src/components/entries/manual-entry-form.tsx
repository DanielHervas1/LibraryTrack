"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { inputClass, primaryButtonClass } from "@/components/ui/styles";
import { createManualEntry } from "@/lib/actions/entries";
import {
  COVER_MIME_TYPES,
  MEDIA_TYPES,
  MEDIA_TYPE_LABELS,
  STATUSES,
  statusLabel,
  type MediaType,
} from "@/lib/constants";
import { validateCoverFile } from "@/lib/storage/covers";
import { uploadCover } from "@/lib/storage/upload-cover";

import { GenreEditor } from "./genre-editor";

function NumberField({ name, label, max }: { name: string; label: string; max: number }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="number"
        name={name}
        min={1}
        max={max}
        inputMode="numeric"
        className={inputClass}
      />
    </label>
  );
}

export function ManualEntryForm({
  userId,
  initialType,
}: {
  userId: string;
  initialType: MediaType;
}) {
  const router = useRouter();
  const [mediaType, setMediaType] = useState<MediaType>(initialType);
  const [cover, setCover] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Libera la URL blob: anterior al cambiar de imagen y al desmontar.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleCover(file: File | undefined) {
    setError(null);
    if (!file) return;
    const invalid = validateCoverFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setCover(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    // La portada no viaja en la Server Action: se sube directa a Storage tras crear la entrada.
    formData.delete("cover");

    startTransition(async () => {
      const result = await createManualEntry(formData);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      if (cover) {
        const coverError = await uploadCover(result.id, userId, cover);
        // La entrada ya existe: si falla la portada, se puede volver a subir desde la ficha.
        if (coverError) console.error(coverError);
      }
      router.push(`/entry/${result.id}`);
    });
  }

  const episodes = mediaType === "tv" || mediaType === "anime";

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Tipo</span>
        <select
          name="media_type"
          value={mediaType}
          onChange={(event) => setMediaType(event.target.value as MediaType)}
          className={inputClass}
        >
          {MEDIA_TYPES.map((type) => (
            <option key={type} value={type}>
              {MEDIA_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-4">
        <label className="relative flex aspect-[2/3] w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-surface text-center text-xs text-muted hover:text-foreground">
          {preview ? (
            // Vista previa local (blob:), no pasa por next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Portada elegida"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <span className="px-2">Añadir portada (opcional)</span>
          )}
          <input
            type="file"
            name="cover"
            accept={COVER_MIME_TYPES.join(",")}
            className="sr-only"
            onChange={(event) => handleCover(event.target.files?.[0])}
          />
        </label>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Título</span>
            <input name="title" required maxLength={500} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Año</span>
            <input
              type="number"
              name="release_year"
              min={1800}
              max={2200}
              inputMode="numeric"
              className={inputClass}
            />
          </label>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Título original</span>
        <input name="original_title" maxLength={500} className={inputClass} />
      </label>

      {mediaType !== "movie" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            {mediaType === "book" ? "Autores" : "Creadores / estudio"}
          </span>
          <input
            name="authors"
            placeholder="Separados por comas"
            maxLength={1000}
            className={inputClass}
          />
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        {mediaType === "movie" && (
          <NumberField name="runtime_minutes" label="Duración (min)" max={2000} />
        )}
        {episodes && <NumberField name="total_episodes" label="Episodios totales" max={100_000} />}
        {episodes && <NumberField name="episode_minutes" label="Min. por episodio" max={600} />}
        {mediaType === "book" && <NumberField name="total_pages" label="Páginas" max={100_000} />}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Estado</span>
        <select name="status" defaultValue="planned" className={inputClass}>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status, mediaType)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Sinopsis</span>
        <textarea name="synopsis" rows={4} maxLength={10_000} className={inputClass} />
      </label>

      <GenreEditor initialGenres={[]} />

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Creando…" : "Crear entrada"}
        </button>
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
