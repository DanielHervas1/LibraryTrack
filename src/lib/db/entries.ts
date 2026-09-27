import "server-only";

import { z } from "zod";

import type { EntryStatus, Provider, SortOption } from "@/lib/constants";
import { createClient } from "@/lib/db/server";
import type { Tables } from "@/types/database";

export type Entry = Tables<"entries">;
export type EntryCardData = Pick<
  Entry,
  "id" | "title" | "cover_url" | "media_type" | "status" | "score" | "release_year"
>;

// RLS ya limita todo al usuario de la sesión; el filtro por user_id es defensa extra.

export async function listEntries(
  userId: string,
  { status, sort }: { status?: EntryStatus; sort: SortOption },
): Promise<EntryCardData[]> {
  const supabase = await createClient();
  let query = supabase
    .from("entries")
    .select("id, title, cover_url, media_type, status, score, release_year")
    .eq("user_id", userId);

  if (status) query = query.eq("status", status);

  if (sort === "score") {
    query = query.order("score", { ascending: false, nullsFirst: false });
  } else if (sort === "title") {
    query = query.order("title", { ascending: true });
  }
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getEntry(userId: string, id: string): Promise<Entry | null> {
  if (!z.uuid().safeParse(id).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** externalId → id de la entrada, para marcar resultados de búsqueda ya añadidos. */
export async function findEntryIdsByExternalIds(
  userId: string,
  provider: Provider,
  externalIds: string[],
): Promise<Map<string, string>> {
  if (externalIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .select("id, external_id")
    .eq("user_id", userId)
    .eq("provider", provider)
    .in("external_id", externalIds);
  if (error) throw error;

  return new Map(data.map((row) => [row.external_id as string, row.id]));
}
