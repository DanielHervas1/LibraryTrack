// Conversión de respuestas de TMDB al formato común. Funciones puras (testeables).

import type { MediaDetails, MediaSearchResult } from "./types";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type TmdbMovieSearchItem = {
  id: number;
  title: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
};

export type TmdbMovieDetails = TmdbMovieSearchItem & {
  runtime?: number | null;
  genres?: { id: number; name: string }[];
};

export function tmdbImageUrl(path: string | null | undefined, size = "w500"): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

/** "2021-09-15" → 2021. Devuelve null si la fecha falta o no es válida. */
export function yearFromDate(date: string | null | undefined): number | null {
  const year = Number.parseInt(date?.slice(0, 4) ?? "", 10);
  return Number.isFinite(year) && year > 0 ? year : null;
}

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function mapTmdbMovieSearchItem(item: TmdbMovieSearchItem): MediaSearchResult {
  const originalTitle = emptyToNull(item.original_title);
  return {
    provider: "tmdb",
    externalId: String(item.id),
    mediaType: "movie",
    title: item.title,
    originalTitle: originalTitle !== item.title ? originalTitle : null,
    year: yearFromDate(item.release_date),
    coverUrl: tmdbImageUrl(item.poster_path),
    synopsis: emptyToNull(item.overview),
  };
}

/** `fallbackOverview` se usa cuando TMDB no tiene sinopsis en español. */
export function mapTmdbMovieDetails(
  details: TmdbMovieDetails,
  fallbackOverview?: string | null,
): MediaDetails {
  const base = mapTmdbMovieSearchItem(details);
  return {
    ...base,
    synopsis: base.synopsis ?? emptyToNull(fallbackOverview),
    genres: (details.genres ?? []).map((genre) => genre.name),
    runtimeMinutes: details.runtime && details.runtime > 0 ? details.runtime : null,
  };
}
