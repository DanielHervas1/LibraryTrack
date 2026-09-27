// Utilidades de texto compartidas por los proveedores. Funciones puras.

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  "#039": "'",
  "#39": "'",
};

/** Quita etiquetas HTML (AniList y Google Books las incluyen) y decodifica entidades comunes. */
export function stripHtml(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&([a-z]+|#\d+);/gi, (match, name: string) => ENTITIES[name.toLowerCase()] ?? match)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || null;
}

export function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** "2021-09-15" o "2021" → 2021. Devuelve null si falta o no es válido. */
export function yearFromDate(date: string | null | undefined): number | null {
  const year = Number.parseInt(date?.slice(0, 4) ?? "", 10);
  return Number.isFinite(year) && year > 0 ? year : null;
}

export function positiveIntOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

export function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLocaleLowerCase("es");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
