"use server";

import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { todayISO } from "@/lib/constants";
import { getEntry, type Tag } from "@/lib/db/entries";
import { createClient } from "@/lib/db/server";
import { tagNameSchema } from "@/lib/validation/tag";

import type { ActionState } from "./entries";
import { revalidateEntryPages } from "./revalidate";

export type TagActionResult = { status: "saved"; tag: Tag } | { status: "error"; message: string };

const uuid = z.uuid();
const prioritySchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.null()]);

/** Comprueba sesión y que la entrada existe y es del usuario. */
async function ownEntry(entryId: string) {
  const user = await requireUser();
  const entry = await getEntry(user.id, entryId);
  return { user, entry };
}

export async function setFavorite(entryId: string, isFavorite: boolean): Promise<ActionState> {
  const { user, entry } = await ownEntry(entryId);
  if (!entry) return { status: "error", message: "La entrada ya no existe." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("entries")
    .update({ is_favorite: Boolean(isFavorite) })
    .eq("user_id", user.id)
    .eq("id", entryId);
  if (error) return { status: "error", message: "No se pudo guardar el favorito." };

  revalidateEntryPages(entryId);
  return { status: "saved", at: Date.now() };
}

export async function setPriority(entryId: string, priority: number | null): Promise<ActionState> {
  const parsed = prioritySchema.safeParse(priority);
  if (!parsed.success) return { status: "error", message: "Prioridad no válida." };

  const { user, entry } = await ownEntry(entryId);
  if (!entry) return { status: "error", message: "La entrada ya no existe." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("entries")
    .update({ priority: parsed.data })
    .eq("user_id", user.id)
    .eq("id", entryId);
  if (error) return { status: "error", message: "No se pudo guardar la prioridad." };

  revalidateEntryPages(entryId);
  return { status: "saved", at: Date.now() };
}

/** Añade un tag a la entrada, creándolo si no existe (sin distinguir mayúsculas). */
export async function addTag(entryId: string, rawName: string): Promise<TagActionResult> {
  const name = tagNameSchema.safeParse(rawName);
  if (!name.success) {
    return { status: "error", message: name.error.issues[0]?.message ?? "Tag no válido." };
  }

  const { user, entry } = await ownEntry(entryId);
  if (!entry) return { status: "error", message: "La entrada ya no existe." };

  const supabase = await createClient();
  const nameKey = name.data.toLowerCase();

  // Crea el tag si no existe; si ya existe (misma name_key) no hace nada.
  const upsert = await supabase
    .from("tags")
    .upsert(
      { user_id: user.id, name: name.data },
      { onConflict: "user_id,name_key", ignoreDuplicates: true },
    );
  if (upsert.error) {
    console.error("addTag upsert", upsert.error);
    return { status: "error", message: "No se pudo crear el tag." };
  }

  const { data: tag, error } = await supabase
    .from("tags")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("name_key", nameKey)
    .single();
  if (error) return { status: "error", message: "No se pudo crear el tag." };

  const link = await supabase
    .from("entry_tags")
    .upsert(
      { entry_id: entryId, tag_id: tag.id, user_id: user.id },
      { onConflict: "entry_id,tag_id", ignoreDuplicates: true },
    );
  if (link.error) {
    console.error("addTag link", link.error);
    return { status: "error", message: "No se pudo añadir el tag." };
  }

  revalidateEntryPages(entryId);
  return { status: "saved", tag };
}

export async function removeTag(entryId: string, tagId: string): Promise<ActionState> {
  if (!uuid.safeParse(tagId).success) return { status: "error", message: "Tag no válido." };
  const { user, entry } = await ownEntry(entryId);
  if (!entry) return { status: "error", message: "La entrada ya no existe." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("entry_tags")
    .delete()
    .eq("user_id", user.id)
    .eq("entry_id", entryId)
    .eq("tag_id", tagId);
  if (error) return { status: "error", message: "No se pudo quitar el tag." };

  revalidateEntryPages(entryId);
  return { status: "saved", at: Date.now() };
}

/** Recalcula rewatch_count a partir del registro, para que nunca se desincronice. */
async function syncRewatchCount(userId: string, entryId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("activity_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("entry_id", entryId)
    .eq("kind", "rewatched");
  if (error) throw error;

  await supabase
    .from("entries")
    .update({ rewatch_count: count ?? 0 })
    .eq("user_id", userId)
    .eq("id", entryId);
}

/** "Volver a ver / leer": suma un rewatch con la fecha indicada (hoy por defecto). */
export async function addRewatch(entryId: string, date?: string): Promise<ActionState> {
  const day = date ?? todayISO();
  if (!z.iso.date().safeParse(day).success) return { status: "error", message: "Fecha no válida." };

  const { user, entry } = await ownEntry(entryId);
  if (!entry) return { status: "error", message: "La entrada ya no existe." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("activity_log")
    .insert({ user_id: user.id, entry_id: entryId, kind: "rewatched", date: day });
  if (error) {
    console.error("addRewatch", error);
    return { status: "error", message: "No se pudo registrar." };
  }

  await syncRewatchCount(user.id, entryId);
  revalidateEntryPages(entryId);
  return { status: "saved", at: Date.now() };
}

export async function removeRewatch(entryId: string, rewatchId: string): Promise<ActionState> {
  if (!uuid.safeParse(rewatchId).success)
    return { status: "error", message: "Registro no válido." };
  const { user, entry } = await ownEntry(entryId);
  if (!entry) return { status: "error", message: "La entrada ya no existe." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("activity_log")
    .delete()
    .eq("user_id", user.id)
    .eq("entry_id", entryId)
    .eq("id", rewatchId)
    .eq("kind", "rewatched");
  if (error) return { status: "error", message: "No se pudo borrar." };

  await syncRewatchCount(user.id, entryId);
  revalidateEntryPages(entryId);
  return { status: "saved", at: Date.now() };
}
