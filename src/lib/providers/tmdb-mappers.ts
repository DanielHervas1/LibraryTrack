// Conversión de respuestas de TMDB al formato común. Funciones puras (testeables).

import { normalizeTmdbTvGenres } from "./genres";
import { emptyToNull, positiveIntOrNull, yearFromDate } from "./text";
import { EMPTY_DETAILS, type MediaDetails, type MediaSearchResult } from "./types";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

type TmdbGenre = { id: number; name: string };

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
  genres?: TmdbGenre[];
};

export type TmdbTvSearchItem = {
  id: number;
  name: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  first_air_date?: string;
};

export type TmdbTvDetails = TmdbTvSearchItem & {
  genres?: TmdbGenre[];
  number_of_episodes?: number | null;
  episode_run_time?: number[];
  last_episode_to_air?: { runtime?: number | null } | null;
  seasons?: { season_number: number; episode_count: number }[];
  created_by?: { name: string }[];
};

export function tmdbImageUrl(path: string | null | undefined, size = "w500"): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

function baseResult(
  mediaType: "movie" | "tv",
  item: { id: number; overview?: string; poster_path?: string | null },
  title: string,
  originalTitle: string | undefined,
  date: string | undefined,
): MediaSearchResult {
  const original = emptyToNull(originalTitle);
  return {
    provider: "tmdb",
    externalId: String(item.id),
    mediaType,
    title,
    originalTitle: original !== title ? original : null,
    year: yearFromDate(date),
    coverUrl: tmdbImageUrl(item.poster_path),
    synopsis: emptyToNull(item.overview),
    authors: [],
  };
}

export function mapTmdbMovieSearchItem(item: TmdbMovieSearchItem): MediaSearchResult {
  return baseResult("movie", item, item.title, item.original_title, item.release_date);
}

export function mapTmdbTvSearchItem(item: TmdbTvSearchItem): MediaSearchResult {
  return baseResult("tv", item, item.name, item.original_name, item.first_air_date);
}

/** `fallbackOverview` se usa cuando TMDB no tiene sinopsis en español. */
export function mapTmdbMovieDetails(
  details: TmdbMovieDetails,
  fallbackOverview?: string | null,
): MediaDetails {
  const base = mapTmdbMovieSearchItem(details);
  return {
    ...base,
    ...EMPTY_DETAILS,
    synopsis: base.synopsis ?? emptyToNull(fallbackOverview),
    genres: (details.genres ?? []).map((genre) => genre.name),
    runtimeMinutes: positiveIntOrNull(details.runtime),
  };
}

export function mapTmdbTvDetails(
  details: TmdbTvDetails,
  fallbackOverview?: string | null,
): MediaDetails {
  const base = mapTmdbTvSearchItem(details);
  const seasons = (details.seasons ?? [])
    .filter((season) => season.season_number > 0 && season.episode_count > 0)
    .map((season) => ({ number: season.season_number, episodes: season.episode_count }))
    .sort((a, b) => a.number - b.number);

  // episode_run_time suele venir vacío; el último episodio emitido es mejor referencia.
  const episodeMinutes =
    positiveIntOrNull(details.episode_run_time?.[0]) ??
    positiveIntOrNull(details.last_episode_to_air?.runtime);

  return {
    ...base,
    ...EMPTY_DETAILS,
    synopsis: base.synopsis ?? emptyToNull(fallbackOverview),
    authors: (details.created_by ?? []).map((person) => person.name),
    genres: normalizeTmdbTvGenres((details.genres ?? []).map((genre) => genre.name)),
    totalEpisodes:
      positiveIntOrNull(details.number_of_episodes) ??
      positiveIntOrNull(seasons.reduce((sum, season) => sum + season.episodes, 0)),
    episodeMinutes,
    seasons: seasons.length > 0 ? seasons : null,
  };
}
