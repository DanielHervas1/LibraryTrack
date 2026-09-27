import { COVER_BUCKET, COVER_MAX_BYTES, COVER_MIME_TYPES } from "@/lib/constants";

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

const COVER_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Valida una imagen antes de subirla. Devuelve el mensaje de error o null si es válida. */
export function validateCoverFile(file: { type: string; size: number }): string | null {
  if (!COVER_MIME_TYPES.includes(file.type)) return "Formato no válido. Usa JPG, PNG o WebP.";
  if (file.size > COVER_MAX_BYTES) return "La imagen supera 5 MB.";
  return null;
}

/** Ruta en el bucket: <user>/<entry>/<uuid>.<ext> (las políticas RLS exigen la carpeta del usuario). */
export function coverStoragePath(userId: string, entryId: string, mimeType: string, id: string) {
  return `${userId}/${entryId}/${id}.${COVER_EXTENSIONS[mimeType] ?? "jpg"}`;
}
