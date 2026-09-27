import "server-only";

import { createClient } from "@/lib/db/server";
import type { StatsEntry } from "@/lib/stats";

/** Todo el catálogo con sus tags, en el formato que espera computeStats. */
export async function getStatsEntries(userId: string): Promise<StatsEntry[]> {
  const supabase = await createClient();
  const [entries, links] = await Promise.all([
    supabase
      .from("entries")
      .select(
        "id, media_type, status, score, genres, runtime_minutes, episode_minutes, total_episodes, current_season, current_episode, current_page, total_pages, rewatch_count, finished_at, metadata",
      )
      .eq("user_id", userId),
    supabase.from("entry_tags").select("entry_id, tag:tags(name)").eq("user_id", userId),
  ]);
  if (entries.error) throw entries.error;
  if (links.error) throw links.error;

  const tagsByEntry = new Map<string, string[]>();
  for (const link of links.data) {
    if (link.tag)
      tagsByEntry.set(link.entry_id, [...(tagsByEntry.get(link.entry_id) ?? []), link.tag.name]);
  }

  return entries.data.map(({ id, ...entry }) => ({ ...entry, tags: tagsByEntry.get(id) ?? [] }));
}
