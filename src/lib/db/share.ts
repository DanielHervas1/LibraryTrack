import "server-only";

import { createClient } from "@/lib/db/server";
import { isValidShareToken } from "@/lib/share";
import type { Database } from "@/types/database";

export type SharedEntry = Database["public"]["Functions"]["shared_entries"]["Returns"][number];

export type SharedCollection = {
  displayName: string | null;
  hideReviews: boolean;
  entries: SharedEntry[];
};

/**
 * Colección pública de un enlace compartido, o null si el token no existe.
 * Pasa por las funciones SQL shared_profile/shared_entries (SECURITY DEFINER), que solo
 * devuelven entradas no privadas: funciona sin sesión y sin la service-role key.
 */
export async function getSharedCollection(token: string): Promise<SharedCollection | null> {
  if (!isValidShareToken(token)) return null;

  const supabase = await createClient();
  const [profile, entries] = await Promise.all([
    supabase.rpc("shared_profile", { p_token: token }).maybeSingle(),
    supabase.rpc("shared_entries", { p_token: token }),
  ]);
  if (profile.error) throw profile.error;
  if (entries.error) throw entries.error;
  if (!profile.data) return null;

  return {
    displayName: profile.data.display_name,
    hideReviews: profile.data.hide_reviews,
    entries: entries.data,
  };
}
