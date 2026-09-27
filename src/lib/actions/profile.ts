"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";

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
