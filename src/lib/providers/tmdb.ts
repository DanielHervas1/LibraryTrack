import "server-only";

import {
  mapTmdbMovieDetails,
  mapTmdbMovieSearchItem,
  mapTmdbTvDetails,
  mapTmdbTvSearchItem,
  type TmdbMovieDetails,
  type TmdbMovieSearchItem,
  type TmdbTvDetails,
  type TmdbTvSearchItem,
} from "./tmdb-mappers";
import type { MediaProvider } from "./types";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const LANGUAGE = "es-ES";

function getToken(): string {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) throw new Error("Falta TMDB_READ_ACCESS_TOKEN en .env.local");
  return token;
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const url = new URL(`${TMDB_API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}`, Accept: "application/json" },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`TMDB ${response.status} en ${path}`);
  return (await response.json()) as T;
}

/** Ficha en español; si no tiene sinopsis, se pide la inglesa como respaldo. */
async function fetchDetailsWithFallback<T extends { overview?: string }>(path: string) {
  const details = await tmdbFetch<T>(path, { language: LANGUAGE });
  if (!details) return null;

  let fallbackOverview: string | null = null;
  if (!details.overview?.trim()) {
    const english = await tmdbFetch<T>(path, { language: "en-US" });
    fallbackOverview = english?.overview ?? null;
  }
  return { details, fallbackOverview };
}

export const tmdbProvider: MediaProvider = {
  id: "tmdb",
  mediaTypes: ["movie", "tv"],
  externalIdPattern: /^\d{1,10}$/,

  async search(query, mediaType) {
    const params = { query, language: LANGUAGE, include_adult: "false" };
    if (mediaType === "tv") {
      const data = await tmdbFetch<{ results: TmdbTvSearchItem[] }>("/search/tv", params);
      return (data?.results ?? []).slice(0, 20).map(mapTmdbTvSearchItem);
    }
    const data = await tmdbFetch<{ results: TmdbMovieSearchItem[] }>("/search/movie", params);
    return (data?.results ?? []).slice(0, 20).map(mapTmdbMovieSearchItem);
  },

  async getDetails(externalId, mediaType) {
    if (mediaType === "tv") {
      const result = await fetchDetailsWithFallback<TmdbTvDetails>(`/tv/${externalId}`);
      return result && mapTmdbTvDetails(result.details, result.fallbackOverview);
    }
    const result = await fetchDetailsWithFallback<TmdbMovieDetails>(`/movie/${externalId}`);
    return result && mapTmdbMovieDetails(result.details, result.fallbackOverview);
  },
};
