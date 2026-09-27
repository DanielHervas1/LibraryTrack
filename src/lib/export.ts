// Exportación de todos los datos (JSON completo y CSV plano). Funciones puras.

import { toCsv } from "@/lib/csv";
import type { Tables } from "@/types/database";

export type ExportEntry = Omit<Tables<"entries">, "user_id"> & {
  tags: string[];
  rewatch_dates: string[];
};

export const EXPORT_VERSION = 1;

export function buildExportJson(entries: ExportEntry[], exportedAt: Date) {
  return {
    app: "LibraryTrack",
    version: EXPORT_VERSION,
    exported_at: exportedAt.toISOString(),
    count: entries.length,
    entries,
  };
}

const CSV_COLUMNS: [string, (entry: ExportEntry) => string | number | boolean | null][] = [
  ["id", (e) => e.id],
  ["tipo", (e) => e.media_type],
  ["titulo", (e) => e.title],
  ["titulo_original", (e) => e.original_title],
  ["anio", (e) => e.release_year],
  ["estado", (e) => e.status],
  ["nota", (e) => e.score],
  ["favorito", (e) => e.is_favorite],
  ["prioridad", (e) => e.priority],
  ["inicio", (e) => e.started_at],
  ["fin", (e) => e.finished_at],
  ["generos", (e) => e.genres.join("; ")],
  ["tags", (e) => e.tags.join("; ")],
  ["autores", (e) => e.authors.join("; ")],
  ["opinion", (e) => e.review],
  ["duracion_min", (e) => e.runtime_minutes],
  ["temporada_actual", (e) => e.current_season],
  ["episodio_actual", (e) => e.current_episode],
  ["episodios_totales", (e) => e.total_episodes],
  ["min_por_episodio", (e) => e.episode_minutes],
  ["pagina_actual", (e) => e.current_page],
  ["paginas_totales", (e) => e.total_pages],
  ["rewatches", (e) => e.rewatch_count],
  ["fechas_rewatch", (e) => e.rewatch_dates.join("; ")],
  ["proveedor", (e) => e.provider],
  ["id_externo", (e) => e.external_id],
  ["portada", (e) => e.cover_url],
  ["sinopsis", (e) => e.synopsis],
  ["creado", (e) => e.created_at],
  ["actualizado", (e) => e.updated_at],
];

/** Una fila por entrada; las listas se unen con "; ". */
export function entriesToCsv(entries: ExportEntry[]): string {
  return toCsv(
    CSV_COLUMNS.map(([header]) => header),
    entries.map((entry) => CSV_COLUMNS.map(([, get]) => get(entry))),
  );
}

export function exportFilename(format: "json" | "csv", date: string): string {
  return `librarytrack-${date}.${format}`;
}
