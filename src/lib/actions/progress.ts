"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { todayISO } from "@/lib/constants";
import { getEntry, type Entry } from "@/lib/db/entries";
import { createClient } from "@/lib/db/server";
import {
  advancePages as computeAdvancePages,
  finalPosition,
  hasEpisodes,
  isProgressComplete,
  nextEpisode,
  progressStateFromRow,
} from "@/lib/progress";
import { parseProgressForm } from "@/lib/validation/entry";
import type { TablesUpdate } from "@/types/database";

import type { ActionState } from "./entries";

const pagesSchema = z.number().int().min(1).max(5000);

/**
 * Guarda cambios de progreso. Si la entrada estaba pendiente o en pausa, pasa a
 * "en curso" y apunta hoy como fecha de inicio si no tenía.
 */
async function saveProgress(
  entry: Entry,
  userId: string,
  changes: TablesUpdate<"entries">,
): Promise<ActionState> {
  const update: TablesUpdate<"entries"> = { ...changes };
  if (entry.status === "planned" || entry.status === "paused") {
    update.status = "in_progress";
    if (!entry.started_at) update.started_at = todayISO();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .update(update)
    .eq("user_id", userId)
    .eq("id", entry.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("saveProgress", error);
    return { status: "error", message: "No se pudo guardar el progreso." };
  }
  if (!data) return { status: "error", message: "La entrada ya no existe." };

  revalidatePath("/");
  revalidatePath(`/entry/${entry.id}`);
  return { status: "saved", at: Date.now() };
}

/** +1 episodio (series y anime). En series salta de temporada al acabar una. */
export async function advanceEpisode(id: string): Promise<ActionState> {
  const user = await requireUser();
  const entry = await getEntry(user.id, id);
  if (!entry) return { status: "error", message: "La entrada ya no existe." };
  if (!hasEpisodes(entry.media_type))
    return { status: "error", message: "Esta entrada no tiene episodios." };

  const next = nextEpisode(progressStateFromRow(entry));
  if (!next) return { status: "error", message: "Ya estás en el último episodio." };

  return saveProgress(entry, user.id, {
    current_episode: next.episode,
    ...(entry.media_type === "tv" ? { current_season: next.season } : {}),
  });
}

/** +N páginas (libros), sin pasarse del total. */
export async function advancePages(id: string, amount: number): Promise<ActionState> {
  const user = await requireUser();
  if (!pagesSchema.safeParse(amount).success)
    return { status: "error", message: "Cantidad no válida." };

  const entry = await getEntry(user.id, id);
  if (!entry) return { status: "error", message: "La entrada ya no existe." };
  if (entry.media_type !== "book")
    return { status: "error", message: "Esta entrada no tiene páginas." };

  const state = progressStateFromRow(entry);
  if (isProgressComplete(state))
    return { status: "error", message: "Ya estás en la última página." };

  return saveProgress(entry, user.id, { current_page: computeAdvancePages(state, amount) });
}

/** Ajuste manual del progreso y los totales. */
export async function updateProgress(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const entry = await getEntry(user.id, id);
  if (!entry) return { status: "error", message: "La entrada ya no existe." };

  const parsed = parseProgressForm(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa los campos." };
  }

  // Solo los campos que corresponden al tipo.
  const values = parsed.data;
  const changes: TablesUpdate<"entries"> = hasEpisodes(entry.media_type)
    ? {
        current_episode: values.current_episode,
        total_episodes: values.total_episodes,
        episode_minutes: values.episode_minutes,
        ...(entry.media_type === "tv" ? { current_season: values.current_season } : {}),
      }
    : entry.media_type === "book"
      ? { current_page: values.current_page, total_pages: values.total_pages }
      : {};

  return saveProgress(entry, user.id, changes);
}

/** Marca como completado: estado, fecha de fin (si falta) y progreso al final. */
export async function markCompleted(id: string): Promise<ActionState> {
  const user = await requireUser();
  const entry = await getEntry(user.id, id);
  if (!entry) return { status: "error", message: "La entrada ya no existe." };

  const today = todayISO();
  const supabase = await createClient();
  const { error } = await supabase
    .from("entries")
    .update({
      status: "completed",
      finished_at: entry.finished_at ?? today,
      started_at: entry.started_at ?? entry.finished_at ?? today,
      ...finalPosition(progressStateFromRow(entry)),
    })
    .eq("user_id", user.id)
    .eq("id", id);

  if (error) {
    console.error("markCompleted", error);
    return { status: "error", message: "No se pudo marcar como completado." };
  }

  revalidatePath("/");
  revalidatePath(`/entry/${id}`);
  return { status: "saved", at: Date.now() };
}
