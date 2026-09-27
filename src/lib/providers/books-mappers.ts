// Conversión de Google Books y Open Library al formato común. Funciones puras (testeables).

import { normalizeBookGenres } from "./genres";
import { emptyToNull, positiveIntOrNull, stripHtml, yearFromDate } from "./text";
import { EMPTY_DETAILS, type MediaDetails, type MediaSearchResult } from "./types";

// ---------------------------------------------------------------------------
// Google Books
// ---------------------------------------------------------------------------

export type GoogleBooksVolume = {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: Partial<Record<"thumbnail" | "small" | "medium" | "large", string>>;
  };
};

/** Las miniaturas llegan por http y con el efecto "page curl": https y sin él. */
export function googleBooksCoverUrl(links: GoogleBooksVolume["volumeInfo"]["imageLinks"]) {
  const url = links?.large ?? links?.medium ?? links?.small ?? links?.thumbnail;
  if (!url) return null;
  return url.replace(/^http:\/\//, "https://").replace(/&edge=curl/, "");
}

export function mapGoogleBooksSearchItem(volume: GoogleBooksVolume): MediaSearchResult {
  const info = volume.volumeInfo;
  return {
    provider: "google_books",
    externalId: volume.id,
    mediaType: "book",
    title: emptyToNull(info.title) ?? "Sin título",
    originalTitle: null,
    year: yearFromDate(info.publishedDate),
    coverUrl: googleBooksCoverUrl(info.imageLinks),
    synopsis: stripHtml(info.description),
    authors: info.authors ?? [],
  };
}

export function mapGoogleBooksDetails(volume: GoogleBooksVolume): MediaDetails {
  return {
    ...mapGoogleBooksSearchItem(volume),
    ...EMPTY_DETAILS,
    genres: normalizeBookGenres(volume.volumeInfo.categories ?? []),
    totalPages: positiveIntOrNull(volume.volumeInfo.pageCount),
  };
}

// ---------------------------------------------------------------------------
// Open Library
// ---------------------------------------------------------------------------

export type OpenLibraryDoc = {
  key: string; // "/works/OL8479867W"
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  number_of_pages_median?: number;
  subject?: string[];
  /** Con `lang=es`, la primera edición es la española si existe. */
  editions?: { docs?: { title?: string; cover_i?: number }[] };
};

export type OpenLibraryWork = {
  description?: string | { value?: string };
  subjects?: string[];
};

export const OPEN_LIBRARY_SEARCH_FIELDS =
  "key,title,author_name,first_publish_year,cover_i,number_of_pages_median,subject,editions,editions.title,editions.cover_i";

export function openLibraryCoverUrl(coverId: number | undefined): string | null {
  return coverId && coverId > 0 ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
}

/** "/works/OL8479867W" → "OL8479867W". */
export function openLibraryWorkId(key: string): string {
  return key.replace(/^\/works\//, "");
}

/** Las descripciones usan markdown y referencias tipo "([source][1])" y "[1]: https://…". */
export function cleanOpenLibraryDescription(description: OpenLibraryWork["description"]) {
  const raw = typeof description === "string" ? description : description?.value;
  if (!raw) return null;
  const text = raw
    .replace(/\(\[[^\]]*\]\[\d+\]\)/g, "")
    .replace(/^\s*\[\d+\]:.*$/gm, "")
    .replace(/^-{3,}\s*$/gm, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1");
  return stripHtml(text);
}

export function mapOpenLibraryDoc(doc: OpenLibraryDoc): MediaSearchResult {
  const edition = doc.editions?.docs?.[0];
  const title = emptyToNull(edition?.title) ?? doc.title;
  return {
    provider: "open_library",
    externalId: openLibraryWorkId(doc.key),
    mediaType: "book",
    title,
    originalTitle: doc.title !== title ? doc.title : null,
    year: positiveIntOrNull(doc.first_publish_year),
    coverUrl: openLibraryCoverUrl(edition?.cover_i ?? doc.cover_i),
    synopsis: null,
    authors: doc.author_name ?? [],
  };
}

export function mapOpenLibraryDetails(
  doc: OpenLibraryDoc,
  work: OpenLibraryWork | null,
): MediaDetails {
  return {
    ...mapOpenLibraryDoc(doc),
    ...EMPTY_DETAILS,
    synopsis: cleanOpenLibraryDescription(work?.description),
    genres: normalizeBookGenres([...(doc.subject ?? []), ...(work?.subjects ?? [])]),
    totalPages: positiveIntOrNull(doc.number_of_pages_median),
  };
}
