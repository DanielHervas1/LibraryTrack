import "server-only";

import type { MediaType } from "@/lib/constants";

import { anilistProvider } from "./anilist";
import { googleBooksProvider, hasGoogleBooksKey, openLibraryProvider } from "./books";
import { tmdbProvider } from "./tmdb";
import type { ExternalProvider, MediaProvider } from "./types";

const PROVIDERS: MediaProvider[] = [
  tmdbProvider,
  anilistProvider,
  googleBooksProvider,
  openLibraryProvider,
];

/** Proveedor con el que se busca cada tipo. Libros: Google Books si hay key, si no Open Library. */
export function getSearchProvider(mediaType: MediaType): MediaProvider {
  switch (mediaType) {
    case "movie":
    case "tv":
      return tmdbProvider;
    case "anime":
      return anilistProvider;
    case "book":
      return hasGoogleBooksKey() ? googleBooksProvider : openLibraryProvider;
  }
}

/**
 * Proveedor por id (al añadir un resultado), solo si soporta ese tipo y el id externo
 * tiene un formato válido. Así nunca se construyen URLs con datos arbitrarios.
 */
export function getProvider(
  id: ExternalProvider,
  mediaType: MediaType,
  externalId: string,
): MediaProvider | null {
  const provider = PROVIDERS.find((p) => p.id === id);
  if (!provider?.mediaTypes.includes(mediaType)) return null;
  return provider.externalIdPattern.test(externalId) ? provider : null;
}
