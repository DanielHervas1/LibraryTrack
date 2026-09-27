// Conversión de respuestas de AniList al formato común. Funciones puras (testeables).

import { normalizeAnilistGenres } from "./genres";
import { emptyToNull, positiveIntOrNull, stripHtml } from "./text";
import { EMPTY_DETAILS, type MediaDetails, type MediaSearchResult } from "./types";

export type AnilistMedia = {
  id: number;
  title: { romaji?: string | null; english?: string | null; native?: string | null };
  coverImage?: { extraLarge?: string | null; large?: string | null } | null;
  startDate?: { year?: number | null } | null;
  episodes?: number | null;
  duration?: number | null;
  genres?: string[] | null;
  description?: string | null;
  studios?: { nodes: { name: string }[] } | null;
};

/** Campos pedidos a AniList; compartidos por la búsqueda y la ficha. */
export const ANILIST_MEDIA_FIELDS = `
  id
  title { romaji english native }
  coverImage { extraLarge large }
  startDate { year }
  episodes
  duration
  genres
  description(asHtml: false)
  studios(isMain: true) { nodes { name } }
`;

/** AniList añade a veces "(Source: …)" al final de la sinopsis. */
function cleanDescription(description: string | null | undefined): string | null {
  const text = stripHtml(description);
  return text ? emptyToNull(text.replace(/\(Source:[^)]*\)\s*$/i, "")) : null;
}

/** Título: inglés si existe, si no romaji. El original muestra el otro. */
function pickTitles(title: AnilistMedia["title"]) {
  const english = emptyToNull(title.english);
  const romaji = emptyToNull(title.romaji);
  const native = emptyToNull(title.native);
  const main = english ?? romaji ?? native ?? "Sin título";
  const original = english ? (romaji ?? native) : native;
  return { title: main, originalTitle: original !== main ? original : null };
}

export function mapAnilistSearchItem(media: AnilistMedia): MediaSearchResult {
  return {
    provider: "anilist",
    externalId: String(media.id),
    mediaType: "anime",
    ...pickTitles(media.title),
    year: positiveIntOrNull(media.startDate?.year),
    coverUrl: media.coverImage?.extraLarge ?? media.coverImage?.large ?? null,
    synopsis: cleanDescription(media.description),
    authors: (media.studios?.nodes ?? []).map((studio) => studio.name),
  };
}

export function mapAnilistDetails(media: AnilistMedia): MediaDetails {
  return {
    ...mapAnilistSearchItem(media),
    ...EMPTY_DETAILS,
    genres: normalizeAnilistGenres(media.genres ?? []),
    totalEpisodes: positiveIntOrNull(media.episodes),
    episodeMinutes: positiveIntOrNull(media.duration),
  };
}
