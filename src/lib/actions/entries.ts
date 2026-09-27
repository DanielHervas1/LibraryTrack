"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { COVER_BUCKET, MEDIA_TYPES, PROVIDERS } from "@/lib/constants";
import { getEntry } from "@/lib/db/entries";
import { createClient } from "@/lib/db/server";
import { parseEntryMetadata } from "@/lib/entry-metadata";
import { getSupabaseEnv } from "@/lib/env";
import { getProvider } from "@/lib/providers";
import { coverPathFromUrl, isOwnCoverUrl } from "@/lib/storage/covers";
import { parseEntryForm, parseManualEntryForm } from "@/lib/validation/entry";

export type ActionState =
  { status: "idle" } | { status: "saved"; at: number } | { status: "error"; message: string };

export type CreateEntryResult =
  { status: "created"; id: string } | { status: "error"; message: string };

const entryIdSchema = z.uuid();

const addFromProviderSchema = z.object({
  provider: z.enum(PROVIDERS).exclude(["manual"]),
  mediaType: z.enum(MEDIA_TYPES),
  externalId: z.string().min(1).max(100),
});

function revalidateEntry(id: string) {
  revalidatePath("/");
  revalidatePath(`/entry/${id}`);
}

/** Borra del bucket una portada subida a mano (si la URL es nuestra). */
async function removeCustomCover(
  supabase: Awaited<ReturnType<typeof createClient>>,
  url: string | null,
) {
  const path = coverPathFromUrl(url, getSupabaseEnv().url);
  if (path) await supabase.storage.from(COVER_BUCKET).remove([path]);
}

/** Crea una entrada con los metadatos del proveedor y abre su ficha. */
export async function addFromProvider(formData: FormData) {
  const user = await requireUser();
  const parsed = addFromProviderSchema.safeParse({
    provider: formData.get("provider"),
    mediaType: formData.get("mediaType"),
    externalId: formData.get("externalId"),
  });
  if (!parsed.success) throw new Error("Datos no válidos.");

  const { provider: providerId, mediaType, externalId } = parsed.data;
  const provider = getProvider(providerId, mediaType, externalId);
  if (!provider) throw new Error("Proveedor no disponible para este tipo.");

  const supabase = await createClient();
  const findExisting = () =>
    supabase
      .from("entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", providerId)
      .eq("external_id", externalId)
      .maybeSingle();

  const existing = await findExisting();
  if (existing.data) redirect(`/entry/${existing.data.id}`);

  // Los metadatos se piden aquí, en el servidor: no se confía en lo que envíe el cliente.
  const details = await provider.getDetails(externalId, mediaType);
  if (!details) throw new Error("No se ha encontrado ese título en el proveedor.");

  const { data, error } = await supabase
    .from("entries")
    .insert({
      user_id: user.id,
      media_type: details.mediaType,
      provider: details.provider,
      external_id: details.externalId,
      title: details.title,
      original_title: details.originalTitle,
      synopsis: details.synopsis,
      cover_url: details.coverUrl,
      release_year: details.year,
      genres: details.genres,
      authors: details.authors,
      runtime_minutes: details.runtimeMinutes,
      total_episodes: details.totalEpisodes,
      episode_minutes: details.episodeMinutes,
      total_pages: details.totalPages,
      metadata: {
        provider_cover_url: details.coverUrl,
        ...(details.seasons ? { seasons: details.seasons } : {}),
      },
    })
    .select("id")
    .single();

  if (error) {
    // Doble clic o dos pestañas: la restricción única ya evitó el duplicado.
    if (error.code === "23505") {
      const again = await findExisting();
      if (again.data) redirect(`/entry/${again.data.id}`);
    }
    throw error;
  }

  revalidatePath("/");
  redirect(`/entry/${data.id}`);
}

/**
 * Crea una entrada a mano. Devuelve el id (en vez de redirigir) para que el cliente
 * pueda subir la portada a covers/<user>/<id>/ antes de abrir la ficha.
 */
export async function createManualEntry(formData: FormData): Promise<CreateEntryResult> {
  const user = await requireUser();
  const parsed = parseManualEntryForm(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa los campos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .insert({ ...parsed.data, user_id: user.id, provider: "manual", external_id: null })
    .select("id")
    .single();

  if (error) {
    console.error("createManualEntry", error);
    return { status: "error", message: "No se pudo crear la entrada." };
  }

  revalidatePath("/");
  return { status: "created", id: data.id };
}

export async function updateEntry(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!entryIdSchema.safeParse(id).success)
    return { status: "error", message: "Entrada no válida." };

  const parsed = parseEntryForm(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa los campos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .update(parsed.data)
    .eq("user_id", user.id)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("updateEntry", error);
    return { status: "error", message: "No se pudo guardar. Inténtalo de nuevo." };
  }
  if (!data) return { status: "error", message: "La entrada ya no existe." };

  revalidateEntry(id);
  return { status: "saved", at: Date.now() };
}

export async function deleteEntry(id: string) {
  const user = await requireUser();
  const entry = await getEntry(user.id, id);
  if (!entry) redirect("/");

  const supabase = await createClient();
  const { error } = await supabase.from("entries").delete().eq("user_id", user.id).eq("id", id);
  if (error) throw error;

  // Limpia todas las portadas subidas para esta entrada.
  const folder = `${user.id}/${id}`;
  const { data: files } = await supabase.storage.from(COVER_BUCKET).list(folder);
  if (files?.length) {
    await supabase.storage.from(COVER_BUCKET).remove(files.map((file) => `${folder}/${file.name}`));
  }

  revalidatePath("/");
  redirect("/");
}

/** Guarda una portada ya subida por el cliente a covers/<user>/<entry>/. */
export async function setCustomCover(id: string, url: string): Promise<ActionState> {
  const user = await requireUser();
  const entry = await getEntry(user.id, id);
  if (!entry) return { status: "error", message: "La entrada ya no existe." };

  const { url: supabaseUrl } = getSupabaseEnv();
  const path = coverPathFromUrl(url, supabaseUrl);
  if (!isOwnCoverUrl(url, supabaseUrl, user.id) || !path?.startsWith(`${user.id}/${id}/`)) {
    return { status: "error", message: "URL de portada no válida." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("entries")
    .update({ cover_url: url })
    .eq("user_id", user.id)
    .eq("id", id);
  if (error) return { status: "error", message: "No se pudo guardar la portada." };

  if (entry.cover_url !== url) await removeCustomCover(supabase, entry.cover_url);
  revalidateEntry(id);
  return { status: "saved", at: Date.now() };
}

/** Vuelve a la portada original del proveedor (o a ninguna, si era manual). */
export async function resetCover(id: string): Promise<ActionState> {
  const user = await requireUser();
  const entry = await getEntry(user.id, id);
  if (!entry) return { status: "error", message: "La entrada ya no existe." };

  const providerCover = parseEntryMetadata(entry.metadata).provider_cover_url ?? null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("entries")
    .update({ cover_url: providerCover })
    .eq("user_id", user.id)
    .eq("id", id);
  if (error) return { status: "error", message: "No se pudo restaurar la portada." };

  await removeCustomCover(supabase, entry.cover_url);
  revalidateEntry(id);
  return { status: "saved", at: Date.now() };
}
