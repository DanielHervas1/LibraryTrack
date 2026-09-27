import "server-only";

import {
  mapGoogleBooksDetails,
  mapGoogleBooksSearchItem,
  mapOpenLibraryDetails,
  mapOpenLibraryDoc,
  OPEN_LIBRARY_SEARCH_FIELDS,
  type GoogleBooksVolume,
  type OpenLibraryDoc,
  type OpenLibraryWork,
} from "./books-mappers";
import type { MediaProvider } from "./types";

// ---------------------------------------------------------------------------
// Google Books: sin key la cuota anónima está agotada en la práctica, así que
// solo se usa si GOOGLE_BOOKS_API_KEY está configurada.
// ---------------------------------------------------------------------------

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

export function hasGoogleBooksKey(): boolean {
  return Boolean(process.env.GOOGLE_BOOKS_API_KEY);
}

async function googleBooksFetch<T>(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${GOOGLE_BOOKS_API}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (key) url.searchParams.set("key", key);

  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Google Books ${response.status}`);
  return (await response.json()) as T;
}

export const googleBooksProvider: MediaProvider = {
  id: "google_books",
  mediaTypes: ["book"],
  externalIdPattern: /^[A-Za-z0-9_-]{6,20}$/,

  async search(query) {
    const data = await googleBooksFetch<{ items?: GoogleBooksVolume[] }>("", {
      q: query,
      maxResults: "20",
      printType: "books",
    });
    return (data?.items ?? []).map(mapGoogleBooksSearchItem);
  },

  async getDetails(externalId) {
    const volume = await googleBooksFetch<GoogleBooksVolume>(`/${externalId}`);
    return volume ? mapGoogleBooksDetails(volume) : null;
  },
};

// ---------------------------------------------------------------------------
// Open Library: sin key. Piden identificar la app con un User-Agent.
// ---------------------------------------------------------------------------

const OPEN_LIBRARY_BASE = "https://openlibrary.org";
const OPEN_LIBRARY_HEADERS = {
  Accept: "application/json",
  "User-Agent": "LibraryTrack/0.1 (personal reading tracker)",
};

async function openLibraryFetch<T>(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${OPEN_LIBRARY_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const response = await fetch(url, { headers: OPEN_LIBRARY_HEADERS });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Open Library ${response.status}`);
  return (await response.json()) as T;
}

function searchOpenLibrary(q: string, limit: number) {
  return openLibraryFetch<{ docs: OpenLibraryDoc[] }>("/search.json", {
    q,
    lang: "es",
    limit: String(limit),
    fields: OPEN_LIBRARY_SEARCH_FIELDS,
  });
}

export const openLibraryProvider: MediaProvider = {
  id: "open_library",
  mediaTypes: ["book"],
  externalIdPattern: /^OL\d{1,12}W$/,

  async search(query) {
    const data = await searchOpenLibrary(query, 20);
    return (data?.docs ?? []).map(mapOpenLibraryDoc);
  },

  async getDetails(externalId) {
    const [search, work] = await Promise.all([
      searchOpenLibrary(`key:/works/${externalId}`, 1),
      openLibraryFetch<OpenLibraryWork>(`/works/${externalId}.json`),
    ]);
    const doc = search?.docs[0];
    return doc ? mapOpenLibraryDetails(doc, work) : null;
  },
};
