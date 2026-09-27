"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";
import { generateShareToken } from "@/lib/share";

import type { ActionState } from "./entries";

const minutesSchema = z.coerce.number().min(0.2).max(10);

/** Minutos por página para estimar las horas de lectura en las estadísticas. */
export async function setMinutesPerPage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = minutesSchema.safeParse(
    String(formData.get("minutes_per_page") ?? "").replace(",", "."),
  );
  if (!parsed.success) return { status: "error", message: "Pon un número entre 0,2 y 10." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, minutes_per_page: parsed.data }, { onConflict: "user_id" });
  if (error) {
    console.error("setMinutesPerPage", error);
    return { status: "error", message: "No se pudo guardar." };
  }

  revalidatePath("/stats");
  revalidatePath("/settings");
  return { status: "saved", at: Date.now() };
}

const shareSettingsSchema = z.object({
  display_name: z
    .string()
    .trim()
    .max(60, "El nombre puede tener como mucho 60 caracteres.")
    .transform((value) => value || null),
  share_hide_reviews: z.boolean(),
});

/** Nombre visible y si se ocultan las opiniones en el perfil compartido. */
export async function updateShareSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = shareSettingsSchema.safeParse({
    display_name: String(formData.get("display_name") ?? ""),
    share_hide_reviews: formData.get("share_hide_reviews") === "on",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa los campos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id" });
  if (error) {
    console.error("updateShareSettings", error);
    return { status: "error", message: "No se pudo guardar." };
  }

  revalidatePath("/settings");
  return { status: "saved", at: Date.now() };
}

/**
 * Activa el perfil compartido con un enlace nuevo. Si ya había uno, lo sustituye: el
 * enlace anterior deja de funcionar al momento.
 */
export async function regenerateShareLink(): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, share_token: generateShareToken() }, { onConflict: "user_id" });
  if (error) {
    console.error("regenerateShareLink", error);
    return { status: "error", message: "No se pudo crear el enlace." };
  }

  revalidatePath("/settings");
  return { status: "saved", at: Date.now() };
}

/** Desactiva el perfil compartido: el enlace deja de funcionar. */
export async function disableShareLink(): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ share_token: null })
    .eq("user_id", user.id);
  if (error) {
    console.error("disableShareLink", error);
    return { status: "error", message: "No se pudo desactivar." };
  }

  revalidatePath("/settings");
  return { status: "saved", at: Date.now() };
}
