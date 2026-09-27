// Lógica de progreso (episodios y páginas). Funciones puras, sin acceso a datos.

import type { MediaType } from "@/lib/constants";
import { parseEntryMetadata } from "@/lib/entry-metadata";
import type { SeasonInfo } from "@/lib/providers/types";
import type { Json } from "@/types/database";

export type ProgressState = {
  mediaType: MediaType;
  currentSeason: number | null;
  currentEpisode: number | null;
  totalEpisodes: number | null;
  currentPage: number | null;
  totalPages: number | null;
  /** Solo series de TMDB: episodios de cada temporada. */
  seasons: SeasonInfo[] | null;
};

export type EpisodePosition = { season: number | null; episode: number };

export function hasEpisodes(mediaType: MediaType): boolean {
  return mediaType === "tv" || mediaType === "anime";
}

/**
 * Siguiente episodio tras el último visto. En series con temporadas, al acabar una
 * temporada pasa al episodio 1 de la siguiente. Devuelve null si ya está al final.
 */
export function nextEpisode(state: ProgressState): EpisodePosition | null {
  const episode = state.currentEpisode ?? 0;
  const seasons = state.mediaType === "tv" ? state.seasons : null;

  if (!seasons?.length) {
    if (state.totalEpisodes !== null && episode >= state.totalEpisodes) return null;
    return { season: state.mediaType === "tv" ? state.currentSeason : null, episode: episode + 1 };
  }

  const seasonNumber = state.currentSeason ?? seasons[0].number;
  const season = seasons.find((s) => s.number === seasonNumber);
  if (!season || episode < season.episodes) return { season: seasonNumber, episode: episode + 1 };

  const next = seasons.find((s) => s.number > seasonNumber);
  return next ? { season: next.number, episode: 1 } : null;
}

/** Episodios vistos en total (sumando temporadas anteriores si se conocen). */
export function watchedEpisodes(state: ProgressState): number {
  const episode = state.currentEpisode ?? 0;
  if (state.mediaType !== "tv" || !state.seasons?.length || state.currentSeason === null) {
    return episode;
  }
  const previous = state.seasons
    .filter((s) => s.number < (state.currentSeason as number))
    .reduce((sum, s) => sum + s.episodes, 0);
  return previous + episode;
}

/** Fracción completada (0-1), o null si no se conoce el total. */
export function progressRatio(state: ProgressState): number | null {
  if (hasEpisodes(state.mediaType)) {
    if (!state.totalEpisodes) return null;
    return Math.min(1, watchedEpisodes(state) / state.totalEpisodes);
  }
  if (state.mediaType === "book") {
    if (!state.totalPages) return null;
    return Math.min(1, (state.currentPage ?? 0) / state.totalPages);
  }
  return null;
}

export function isProgressComplete(state: ProgressState): boolean {
  if (hasEpisodes(state.mediaType)) {
    if (state.mediaType === "tv" && state.seasons?.length) return nextEpisode(state) === null;
    return state.totalEpisodes !== null && (state.currentEpisode ?? 0) >= state.totalEpisodes;
  }
  if (state.mediaType === "book") {
    return state.totalPages !== null && (state.currentPage ?? 0) >= state.totalPages;
  }
  return false;
}

/** Avanza páginas sin pasarse del total (si se conoce). */
export function advancePages(state: ProgressState, amount: number): number {
  const next = (state.currentPage ?? 0) + amount;
  return state.totalPages ? Math.min(next, state.totalPages) : next;
}

/** Posición final, para dejar el progreso completo al marcar como terminado. */
export function finalPosition(state: ProgressState) {
  if (state.mediaType === "tv" && state.seasons?.length) {
    const last = state.seasons[state.seasons.length - 1];
    return { current_season: last.number, current_episode: last.episodes };
  }
  if (hasEpisodes(state.mediaType) && state.totalEpisodes) {
    return { current_episode: state.totalEpisodes };
  }
  if (state.mediaType === "book" && state.totalPages) {
    return { current_page: state.totalPages };
  }
  return {};
}

/** Texto corto: "T2 · E5", "Ep. 12 de 28", "Pág. 120 de 736". Null si no hay progreso. */
export function describeProgress(state: ProgressState): string | null {
  if (hasEpisodes(state.mediaType)) {
    if (!state.currentEpisode) return null;
    if (state.mediaType === "tv" && state.currentSeason !== null) {
      return `T${state.currentSeason} · E${state.currentEpisode}`;
    }
    return state.totalEpisodes
      ? `Ep. ${state.currentEpisode} de ${state.totalEpisodes}`
      : `Ep. ${state.currentEpisode}`;
  }
  if (state.mediaType === "book" && state.currentPage) {
    return state.totalPages
      ? `Pág. ${state.currentPage} de ${state.totalPages}`
      : `Pág. ${state.currentPage}`;
  }
  return null;
}

type ProgressRow = {
  media_type: MediaType;
  current_season: number | null;
  current_episode: number | null;
  total_episodes: number | null;
  current_page: number | null;
  total_pages: number | null;
  metadata?: Json;
};

/** Estado de progreso a partir de una fila de `entries`. */
export function progressStateFromRow(row: ProgressRow): ProgressState {
  return {
    mediaType: row.media_type,
    currentSeason: row.current_season,
    currentEpisode: row.current_episode,
    totalEpisodes: row.total_episodes,
    currentPage: row.current_page,
    totalPages: row.total_pages,
    seasons: parseEntryMetadata(row.metadata).seasons ?? null,
  };
}
