// Normalización de géneros a español, para que películas, series, anime y libros
// compartan nombres (y las estadísticas por género tengan sentido).

import { uniqueStrings } from "./text";

/** Géneros de series de TMDB que llegan en inglés o combinados aunque se pida es-ES. */
const TMDB_TV_GENRES: Record<string, string[]> = {
  "Action & Adventure": ["Acción", "Aventura"],
  "Sci-Fi & Fantasy": ["Ciencia ficción", "Fantasía"],
  "War & Politics": ["Bélica", "Política"],
  Kids: ["Infantil"],
  News: ["Noticias"],
  Reality: ["Reality"],
  Soap: ["Telenovela"],
  Talk: ["Entrevistas"],
};

/** Lista cerrada de géneros de AniList. */
const ANILIST_GENRES: Record<string, string> = {
  Action: "Acción",
  Adventure: "Aventura",
  Comedy: "Comedia",
  Drama: "Drama",
  Ecchi: "Ecchi",
  Fantasy: "Fantasía",
  Hentai: "Hentai",
  Horror: "Terror",
  "Mahou Shoujo": "Mahou shoujo",
  Mecha: "Mecha",
  Music: "Música",
  Mystery: "Misterio",
  Psychological: "Psicológico",
  Romance: "Romance",
  "Sci-Fi": "Ciencia ficción",
  "Slice of Life": "Recuentos de la vida",
  Sports: "Deportes",
  Supernatural: "Sobrenatural",
  Thriller: "Suspense",
};

/**
 * Temas de libros (categorías de Google Books / subjects de Open Library) → género.
 * Son etiquetas libres, así que solo se conservan las que encajan con un género conocido.
 */
const BOOK_GENRE_KEYWORDS: [RegExp, string][] = [
  [/science fiction|ciencia ficci[oó]n|sci-fi/i, "Ciencia ficción"],
  [/fantas(y|[ií]a)/i, "Fantasía"],
  [/horror|terror/i, "Terror"],
  [/myster(y|ies)|misterio|detective/i, "Misterio"],
  [/thriller|suspense/i, "Suspense"],
  [/romance|rom[aá]ntic/i, "Romance"],
  [/historical fiction|novela hist[oó]rica/i, "Histórica"],
  [/crime|crimen|policiac/i, "Crimen"],
  [/adventure|aventura/i, "Aventura"],
  [/biograph|autobiograph|memoir/i, "Biografía"],
  [/poetry|poes[ií]a/i, "Poesía"],
  [/humor|comedy|comedia/i, "Comedia"],
  [/comics|graphic novel|manga|c[oó]mic/i, "Cómic"],
  [/philosoph|filosof/i, "Filosofía"],
  [/^history$|^historia$/i, "Historia"],
  [/self-help|autoayuda/i, "Autoayuda"],
  [/business|econom/i, "Economía"],
  [/^psychology$|^psicolog[ií]a$/i, "Psicología"],
  [/drama|theater|teatro/i, "Drama"],
  [/young adult fiction|juvenile fiction|literatura juvenil/i, "Juvenil"],
];

export function normalizeTmdbTvGenres(names: string[]): string[] {
  return uniqueStrings(names.flatMap((name) => TMDB_TV_GENRES[name] ?? [name]));
}

export function normalizeAnilistGenres(names: string[]): string[] {
  return uniqueStrings(names.map((name) => ANILIST_GENRES[name] ?? name));
}

/** Acepta categorías jerárquicas ("Fiction / Fantasy / Epic") o subjects sueltos. */
export function normalizeBookGenres(subjects: string[], limit = 4): string[] {
  const parts = subjects.flatMap((subject) => subject.split("/").map((part) => part.trim()));
  const genres: string[] = [];
  for (const part of parts) {
    const match = BOOK_GENRE_KEYWORDS.find(([pattern]) => pattern.test(part));
    if (match) genres.push(match[1]);
  }
  return uniqueStrings(genres).slice(0, limit);
}
