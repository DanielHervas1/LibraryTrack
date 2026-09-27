import "server-only";

import type { MediaType } from "@/lib/constants";

import {
  mapTmdbMovieDetails,
  mapTmdbMovieSearchItem,
  type TmdbMovieDetails,
  type TmdbMovieSearchItem,
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

function assertMovie(mediaType: MediaType) {
  // Las series llegan en la Fase 2.
  if (mediaType !== "movie") throw new Error(`TMDB: tipo no soportado todavía (${mediaType})`);
}

export const tmdbProvider: MediaProvider = {
  id: "tmdb",
  mediaTypes: ["movie"],

  async search(query, mediaType) {
    assertMovie(mediaType);
    const data = await tmdbFetch<{ results: TmdbMovieSearchItem[] }>("/search/movie", {
      query,
      language: LANGUAGE,
      include_adult: "false",
    });
    return (data?.results ?? []).slice(0, 20).map(mapTmdbMovieSearchItem);
  },

  async getDetails(externalId, mediaType) {
    assertMovie(mediaType);
    if (!/^\d+$/.test(externalId)) return null;

    const details = await tmdbFetch<TmdbMovieDetails>(`/movie/${externalId}`, {
      language: LANGUAGE,
    });
    if (!details) return null;

    let fallbackOverview: string | null = null;
    if (!details.overview?.trim()) {
      const english = await tmdbFetch<TmdbMovieDetails>(`/movie/${externalId}`, {
        language: "en-US",
      });
      fallbackOverview = english?.overview ?? null;
    }
    return mapTmdbMovieDetails(details, fallbackOverview);
  },
};
