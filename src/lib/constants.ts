import { Constants, type Enums } from "@/types/database";

export type MediaType = Enums<"media_type">;
export type EntryStatus = Enums<"entry_status">;
export type Provider = Enums<"provider">;

export const STATUSES = Constants.public.Enums.entry_status;
export const MEDIA_TYPES = Constants.public.Enums.media_type;
export const PROVIDERS = Constants.public.Enums.provider;

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  movie: "Película",
  tv: "Serie",
  anime: "Anime",
  book: "Libro",
};

export const MEDIA_TYPE_PLURAL_LABELS: Record<MediaType, string> = {
  movie: "Películas",
  tv: "Series",
  anime: "Anime",
  book: "Libros",
};

/** Zona horaria del usuario, para fechas automáticas ("hoy") calculadas en el servidor. */
export const APP_TIME_ZONE = "Europe/Madrid";

/** Fecha de hoy como "YYYY-MM-DD" en la zona horaria de la app. */
export function todayISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(now);
}

const STATUS_LABELS: Record<EntryStatus, string> = {
  planned: "Por ver",
  in_progress: "Viendo",
  paused: "En pausa",
  completed: "Completado",
  dropped: "Abandonado",
};

const BOOK_STATUS_LABELS: Partial<Record<EntryStatus, string>> = {
  planned: "Por leer",
  in_progress: "Leyendo",
};

/** Etiqueta del estado adaptada al tipo ("Viendo" → "Leyendo" en libros). */
export function statusLabel(status: EntryStatus, mediaType?: MediaType): string {
  if (mediaType === "book") return BOOK_STATUS_LABELS[status] ?? STATUS_LABELS[status];
  return STATUS_LABELS[status];
}

export const SORT_OPTIONS = {
  recent: "Recientes",
  score: "Nota",
  title: "Título",
} as const;

export type SortOption = keyof typeof SORT_OPTIONS;

export const COVER_BUCKET = "covers";
export const COVER_MAX_BYTES = 5 * 1024 * 1024;
export const COVER_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
