"use client";

import { setCustomCover } from "@/lib/actions/entries";
import { COVER_BUCKET } from "@/lib/constants";
import { createClient } from "@/lib/db/client";

import { coverStoragePath, validateCoverFile } from "./covers";

/**
 * Sube la portada directamente a Supabase Storage con la sesión del usuario y la
 * asigna a la entrada. El servidor solo valida la URL resultante.
 * Devuelve un mensaje de error, o null si todo fue bien.
 */
export async function uploadCover(
  entryId: string,
  userId: string,
  file: File,
): Promise<string | null> {
  const invalid = validateCoverFile(file);
  if (invalid) return invalid;

  const supabase = createClient();
  const path = coverStoragePath(userId, entryId, file.type, crypto.randomUUID());
  const upload = await supabase.storage
    .from(COVER_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (upload.error) {
    console.error(upload.error);
    return "No se pudo subir la imagen.";
  }

  const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
  const result = await setCustomCover(entryId, data.publicUrl);
  if (result.status === "error") {
    await supabase.storage.from(COVER_BUCKET).remove([path]);
    return result.message;
  }
  return null;
}
