import "server-only";

import { z } from "zod";

import type { EntryStatus, MediaType, Provider, SortOption } from "@/lib/constants";
import { createClient } from "@/lib/db/server";
import type { ExportEntry } from "@/lib/export";
import { toIlikePattern } from "@/lib/search-params";
import type { Tables } from "@/types/database";

export type Entry = Tables<"entries">;
export type Tag = Pick<Tables<"tags">, "id" | "name">;

const CARD_FIELDS =
  "id, title, cover_url, media_type, status, score, release_year, is_favorite, current_season, current_episode, total_episodes, current_page, total_pages" as const;

export type EntryCardData = Pick<
  Entry,
  | "id"
  | "title"
  | "cover_url"
  | "media_type"
  | "status"
  | "score"
  | "release_year"
  | "is_favorite"
  | "current_season"
  | "current_episode"
  | "total_episodes"
  | "current_page"
  | "total_pages"
>;

export type EntryFilters = {
  mediaType?: MediaType;
  status?: EntryStatus;
  sort: SortOption;
  /** Texto libre sobre título y título original. */
  query?: string;
  genre?: string;
  /** Nombre del tag (sin distinguir mayúsculas). */
  tag?: string;
  favorites?: boolean;
};

// RLS ya limita todo al usuario de la sesión; el filtro por user_id es defensa extra.

/** Ids de las entradas con un tag, o null si el tag no existe. */
async function entryIdsWithTag(userId: string, tagName: string): Promise<string[] | null> {
  const supabase = await createClient();
  const { data: tag, error } = await supabase
    .from("tags")
    .select("id")
    .eq("user_id", userId)
    .eq("name_key", tagName.trim().toLowerCase())
    .maybeSingle();
  if (error) throw error;
  if (!tag) return null;

  const { data, error: linksError } = await supabase
    .from("entry_tags")
    .select("entry_id")
    .eq("user_id", userId)
    .eq("tag_id", tag.id);
  if (linksError) throw linksError;
  return data.map((row) => row.entry_id);
}

export async function listEntries(userId: string, filters: EntryFilters): Promise<EntryCardData[]> {
  const { mediaType, status, sort, query: text, genre, tag, favorites } = filters;

  let taggedIds: string[] | null = null;
  if (tag) {
    taggedIds = await entryIdsWithTag(userId, tag);
    if (!taggedIds?.length) return [];
  }

  const supabase = await createClient();
  let query = supabase.from("entries").select(CARD_FIELDS).eq("user_id", userId);

  if (mediaType) query = query.eq("media_type", mediaType);
  if (status) query = query.eq("status", status);
  if (favorites) query = query.eq("is_favorite", true);
  if (genre) query = query.contains("genres", [genre]);
  if (taggedIds) query = query.in("id", taggedIds);
  if (text) {
    const pattern = toIlikePattern(text);
    query = query.or(`title.ilike.${pattern},original_title.ilike.${pattern}`);
  }

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

/** Géneros usados en el catálogo, sin duplicados y ordenados. */
export async function listGenres(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("entries").select("genres").eq("user_id", userId);
  if (error) throw error;

  const genres = new Set(data.flatMap((row) => row.genres));
  return [...genres].sort((a, b) => a.localeCompare(b, "es"));
}

export async function listTags(userId: string): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name")
    .eq("user_id", userId)
    .order("name_key");
  if (error) throw error;
  return data;
}

export async function getEntryTags(userId: string, entryId: string): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entry_tags")
    .select("tag:tags(id, name)")
    .eq("user_id", userId)
    .eq("entry_id", entryId);
  if (error) throw error;

  return data
    .map((row) => row.tag)
    .filter((tag): tag is Tag => tag !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export type Rewatch = { id: string; date: string };

export async function getRewatches(userId: string, entryId: string): Promise<Rewatch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, date")
    .eq("user_id", userId)
    .eq("entry_id", entryId)
    .eq("kind", "rewatched")
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export type PlannedEntry = EntryCardData &
  Pick<Entry, "priority" | "runtime_minutes" | "episode_minutes">;

/** "Mi lista": pendientes, por prioridad (alta primero) y luego los más recientes. */
export async function listPlanned(userId: string): Promise<PlannedEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .select(`${CARD_FIELDS}, priority, runtime_minutes, episode_minutes`)
    .eq("user_id", userId)
    .eq("status", "planned")
    .order("priority", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Todo el catálogo con tags y fechas de rewatch, para exportar. */
export async function getExportEntries(userId: string): Promise<ExportEntry[]> {
  const supabase = await createClient();
  const [entries, links, rewatches] = await Promise.all([
    supabase.from("entries").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("entry_tags").select("entry_id, tag:tags(name)").eq("user_id", userId),
    supabase
      .from("activity_log")
      .select("entry_id, date")
      .eq("user_id", userId)
      .eq("kind", "rewatched")
      .order("date"),
  ]);
  if (entries.error) throw entries.error;
  if (links.error) throw links.error;
  if (rewatches.error) throw rewatches.error;

  const tagsByEntry = new Map<string, string[]>();
  for (const link of links.data) {
    if (!link.tag) continue;
    tagsByEntry.set(link.entry_id, [...(tagsByEntry.get(link.entry_id) ?? []), link.tag.name]);
  }
  const rewatchesByEntry = new Map<string, string[]>();
  for (const row of rewatches.data) {
    rewatchesByEntry.set(row.entry_id, [...(rewatchesByEntry.get(row.entry_id) ?? []), row.date]);
  }

  return entries.data.map(({ user_id, ...entry }) => ({
    ...entry,
    tags: (tagsByEntry.get(entry.id) ?? []).sort((a, b) => a.localeCompare(b, "es")),
    rewatch_dates: rewatchesByEntry.get(entry.id) ?? [],
  }));
}
