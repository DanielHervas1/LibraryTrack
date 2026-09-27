// Selector aleatorio "No sé qué ver". Funciones puras.

import type { MediaType } from "@/lib/constants";

export type PickCandidate = {
  id: string;
  media_type: MediaType;
  runtime_minutes: number | null;
  episode_minutes: number | null;
};

export type PickFilters = {
  mediaType?: MediaType;
  /** Duración máxima en minutos: de la película o de un episodio. No aplica a libros. */
  maxMinutes?: number;
};

/** Minutos que "cuesta" empezar algo: la película entera o un episodio. */
export function sessionMinutes(candidate: PickCandidate): number | null {
  if (candidate.media_type === "movie") return candidate.runtime_minutes;
  if (candidate.media_type === "tv" || candidate.media_type === "anime") {
    return candidate.episode_minutes;
  }
  return null;
}

export function filterCandidates<T extends PickCandidate>(items: T[], filters: PickFilters): T[] {
  return items.filter((item) => {
    if (filters.mediaType && item.media_type !== filters.mediaType) return false;
    if (filters.maxMinutes) {
      if (item.media_type === "book") return false;
      const minutes = sessionMinutes(item);
      // Sin duración conocida no se puede garantizar que quepa: se excluye.
      if (minutes === null || minutes > filters.maxMinutes) return false;
    }
    return true;
  });
}

/**
 * Elige uno al azar. `excludeId` evita repetir el anterior al pulsar "Otra" (si hay más
 * opciones). `random` se inyecta para poder testear.
 */
export function pickRandom<T extends { id: string }>(
  items: T[],
  excludeId?: string | null,
  random: () => number = Math.random,
): T | null {
  const pool =
    items.length > 1 && excludeId ? items.filter((item) => item.id !== excludeId) : items;
  if (pool.length === 0) return null;
  return pool[Math.floor(random() * pool.length)] ?? null;
}
