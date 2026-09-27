import "server-only";

import { createClient } from "@/lib/db/server";
import { DEFAULT_MINUTES_PER_PAGE } from "@/lib/stats";

export type Profile = {
  minutesPerPage: number;
  displayName: string | null;
  /** null = perfil compartido desactivado. */
  shareToken: string | null;
  shareHideReviews: boolean;
};

/** Preferencias del usuario; valores por defecto si aún no ha guardado ninguna. */
export async function getProfile(userId: string): Promise<Profile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("minutes_per_page, display_name, share_token, share_hide_reviews")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return {
    minutesPerPage: data ? Number(data.minutes_per_page) : DEFAULT_MINUTES_PER_PAGE,
    displayName: data?.display_name ?? null,
    shareToken: data?.share_token ?? null,
    shareHideReviews: data?.share_hide_reviews ?? false,
  };
}
