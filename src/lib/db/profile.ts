import "server-only";

import { createClient } from "@/lib/db/server";
import { DEFAULT_MINUTES_PER_PAGE } from "@/lib/stats";

export type Profile = { minutesPerPage: number };

/** Preferencias del usuario; valores por defecto si aún no ha guardado ninguna. */
export async function getProfile(userId: string): Promise<Profile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("minutes_per_page")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return { minutesPerPage: data ? Number(data.minutes_per_page) : DEFAULT_MINUTES_PER_PAGE };
}
