import { z } from "zod";

import { MEDIA_TYPES, STATUSES, type MediaType } from "@/lib/constants";
import { uniqueStrings } from "@/lib/providers/text";

const emptyToNull = (value: string) => (value === "" ? null : value);

const optionalText = (max: number) => z.string().trim().max(max).transform(emptyToNull);

const optionalDate = z
  .union([z.literal(""), z.iso.date()])
  .transform((value) => (value === "" ? null : value));

const optionalInt = (min: number, max: number) =>
  z
    .union([z.literal(""), z.coerce.number().int().min(min).max(max)])
    .transform((value) => (value === "" ? null : value));

const optionalScore = optionalInt(1, 10);

/** Quita duplicados sin distinguir mayúsculas, conservando la primera forma escrita. */
export function dedupeGenres(genres: string[]): string[] {
  return uniqueStrings(genres);
}

const genresField = z.array(z.string().trim().min(1).max(60)).max(20).transform(dedupeGenres);

/** "Autor 1, Autor 2" → ["Autor 1", "Autor 2"]. */
const authorsField = z
  .string()
  .trim()
  .max(1000)
  .transform((value) =>
    uniqueStrings(
      value
        .split(",")
        .map((author) => author.trim())
        .filter(Boolean),
    ).slice(0, 20),
  );

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** Solo incluye el campo si el formulario lo envía (los campos dependen del tipo). */
function ifPresent(formData: FormData, name: string): string | undefined {
  return formData.has(name) ? text(formData, name) : undefined;
}

// ---------------------------------------------------------------------------
// Ficha: campos editables comunes (+ duración en películas y autores en libros)
// ---------------------------------------------------------------------------

export const entryFormSchema = z
  .object({
    title: z.string().trim().min(1, "El título no puede estar vacío.").max(500),
    status: z.enum(STATUSES),
    score: optionalScore,
    review: optionalText(10_000),
    started_at: optionalDate,
    finished_at: optionalDate,
    genres: genresField,
    is_private: z.boolean(),
    runtime_minutes: optionalInt(1, 2000).optional(),
    authors: authorsField.optional(),
  })
  .refine((data) => !data.started_at || !data.finished_at || data.finished_at >= data.started_at, {
    message: "La fecha de fin no puede ser anterior a la de inicio.",
    path: ["finished_at"],
  });

export type EntryFormValues = z.infer<typeof entryFormSchema>;

export function parseEntryForm(formData: FormData) {
  return entryFormSchema.safeParse({
    title: text(formData, "title"),
    status: text(formData, "status"),
    score: text(formData, "score"),
    review: text(formData, "review"),
    started_at: text(formData, "started_at"),
    finished_at: text(formData, "finished_at"),
    genres: formData.getAll("genres").filter((value) => typeof value === "string"),
    // Casilla: si no está marcada, el navegador no la envía.
    is_private: formData.get("is_private") === "on",
    runtime_minutes: ifPresent(formData, "runtime_minutes"),
    authors: ifPresent(formData, "authors"),
  });
}

// ---------------------------------------------------------------------------
// Entrada manual (cuando el título no está en ninguna API)
// ---------------------------------------------------------------------------

export const manualEntrySchema = z.object({
  media_type: z.enum(MEDIA_TYPES),
  title: z.string().trim().min(1, "El título es obligatorio.").max(500),
  original_title: optionalText(500),
  release_year: optionalInt(1800, 2200),
  synopsis: optionalText(10_000),
  status: z.enum(STATUSES),
  genres: genresField,
  authors: authorsField,
  runtime_minutes: optionalInt(1, 2000),
  total_episodes: optionalInt(1, 100_000),
  episode_minutes: optionalInt(1, 600),
  total_pages: optionalInt(1, 100_000),
});

export type ManualEntryValues = z.infer<typeof manualEntrySchema>;

/** Anula los campos que no aplican al tipo (p. ej. páginas en una película). */
export function onlyFieldsForType(values: ManualEntryValues): ManualEntryValues {
  const type: MediaType = values.media_type;
  const episodes = type === "tv" || type === "anime";
  return {
    ...values,
    runtime_minutes: type === "movie" ? values.runtime_minutes : null,
    total_episodes: episodes ? values.total_episodes : null,
    episode_minutes: episodes ? values.episode_minutes : null,
    total_pages: type === "book" ? values.total_pages : null,
    authors: type === "movie" ? [] : values.authors,
  };
}

export function parseManualEntryForm(formData: FormData) {
  const parsed = manualEntrySchema.safeParse({
    media_type: text(formData, "media_type"),
    title: text(formData, "title"),
    original_title: text(formData, "original_title"),
    release_year: text(formData, "release_year"),
    synopsis: text(formData, "synopsis"),
    status: text(formData, "status") || "planned",
    genres: formData.getAll("genres").filter((value) => typeof value === "string"),
    authors: text(formData, "authors"),
    runtime_minutes: text(formData, "runtime_minutes"),
    total_episodes: text(formData, "total_episodes"),
    episode_minutes: text(formData, "episode_minutes"),
    total_pages: text(formData, "total_pages"),
  });
  return parsed.success ? { ...parsed, data: onlyFieldsForType(parsed.data) } : parsed;
}

// ---------------------------------------------------------------------------
// Progreso exacto (temporada/episodio/página y totales)
// ---------------------------------------------------------------------------

export const progressFormSchema = z
  .object({
    current_season: optionalInt(0, 1000),
    current_episode: optionalInt(0, 100_000),
    total_episodes: optionalInt(1, 100_000),
    episode_minutes: optionalInt(1, 600),
    current_page: optionalInt(0, 100_000),
    total_pages: optionalInt(1, 100_000),
  })
  .partial()
  .refine(
    (data) =>
      data.current_episode == null ||
      data.total_episodes == null ||
      data.current_episode <= data.total_episodes,
    { message: "El episodio actual no puede superar el total.", path: ["current_episode"] },
  )
  .refine(
    (data) =>
      data.current_page == null ||
      data.total_pages == null ||
      data.current_page <= data.total_pages,
    { message: "La página actual no puede superar el total.", path: ["current_page"] },
  );

const PROGRESS_FIELDS = [
  "current_season",
  "current_episode",
  "total_episodes",
  "episode_minutes",
  "current_page",
  "total_pages",
] as const;

export function parseProgressForm(formData: FormData) {
  const input: Partial<Record<(typeof PROGRESS_FIELDS)[number], string>> = {};
  for (const field of PROGRESS_FIELDS) {
    const value = ifPresent(formData, field);
    if (value !== undefined) input[field] = value;
  }
  return progressFormSchema.safeParse(input);
}
