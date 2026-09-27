// Lectura segura de parámetros de URL (searchParams llega como string | string[] | undefined).

import {
  MEDIA_TYPES,
  SORT_OPTIONS,
  STATUSES,
  type EntryStatus,
  type MediaType,
  type SortOption,
} from "@/lib/constants";
import type { CatalogFilters } from "@/lib/catalog-url";

export function parseMediaType(value: unknown): MediaType | undefined {
  return MEDIA_TYPES.find((type) => type === value);
}

export function parseStatus(value: unknown): EntryStatus | undefined {
  return STATUSES.find((status) => status === value);
}

export function parseSort(value: unknown): SortOption {
  return typeof value === "string" && value in SORT_OPTIONS ? (value as SortOption) : "recent";
}

/** Texto libre acotado (búsqueda, género, tag). */
export function parseText(value: unknown, max = 100): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim().slice(0, max);
  return text || undefined;
}

/**
 * Prepara un texto para `ilike` dentro de un filtro `.or()` de PostgREST: escapa los
 * comodines de LIKE y quita los caracteres con significado en la sintaxis de filtros.
 */
export function toIlikePattern(query: string): string {
  const escaped = query
    .replace(/[,()"]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/[%_]/g, (char) => `\\${char}`)
    .trim();
  return `%${escaped}%`;
}

/** Todos los filtros del catálogo desde los searchParams de la página. */
export function parseCatalogFilters(
  searchParams: Record<string, string | string[] | undefined>,
): CatalogFilters {
  return {
    mediaType: parseMediaType(searchParams.type),
    status: parseStatus(searchParams.status),
    sort: parseSort(searchParams.sort),
    query: parseText(searchParams.q),
    genre: parseText(searchParams.genre, 60),
    tag: parseText(searchParams.tag, 40),
    favorites: searchParams.fav === "1" || undefined,
  };
}
