import { COVER_BUCKET } from "@/lib/constants";

/** Prefijo de las URLs públicas de las portadas subidas por un usuario. */
export function userCoverUrlPrefix(supabaseUrl: string, userId: string): string {
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${COVER_BUCKET}/${userId}/`;
}

/**
 * Ruta dentro del bucket ("<user>/<entry>/<archivo>") a partir de una URL pública,
 * o null si la URL no es de nuestro bucket (p. ej. una portada de TMDB).
 */
export function coverPathFromUrl(
  url: string | null | undefined,
  supabaseUrl: string,
): string | null {
  if (!url) return null;
  const prefix = `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${COVER_BUCKET}/`;
  if (!url.startsWith(prefix)) return null;
  const path = url.slice(prefix.length).split(/[?#]/)[0];
  return path && !path.includes("..") ? decodeURIComponent(path) : null;
}

/** ¿La URL es una portada subida por este usuario? */
export function isOwnCoverUrl(url: string, supabaseUrl: string, userId: string): boolean {
  const path = coverPathFromUrl(url, supabaseUrl);
  return path !== null && path.startsWith(`${userId}/`);
}
