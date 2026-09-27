import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/db/server";
import type { DiaryEntryRef, DiaryEvent } from "@/lib/diary";

const progressDetailSchema = z.object({
  amount: z.number().int().positive(),
  unit: z.enum(["episode", "page"]),
});

const ENTRY_REF = "id, title, cover_url, media_type" as const;

/**
 * Eventos del diario entre dos fechas (incluidas). Inicio y fin salen de las columnas
 * started_at/finished_at (única fuente de verdad); avances y rewatches, de activity_log.
 */
export async function getDiaryEvents(
  userId: string,
  from: string,
  to: string,
): Promise<DiaryEvent[]> {
  const supabase = await createClient();
  const [started, finished, logs] = await Promise.all([
    supabase
      .from("entries")
      .select(`${ENTRY_REF}, started_at`)
      .eq("user_id", userId)
      .gte("started_at", from)
      .lte("started_at", to),
    supabase
      .from("entries")
      .select(`${ENTRY_REF}, finished_at`)
      .eq("user_id", userId)
      .gte("finished_at", from)
      .lte("finished_at", to),
    supabase
      .from("activity_log")
      .select(`date, kind, detail, entry:entries(${ENTRY_REF})`)
      .eq("user_id", userId)
      .in("kind", ["progress", "rewatched"])
      .gte("date", from)
      .lte("date", to),
  ]);
  if (started.error) throw started.error;
  if (finished.error) throw finished.error;
  if (logs.error) throw logs.error;

  const ref = (row: DiaryEntryRef): DiaryEntryRef => ({
    id: row.id,
    title: row.title,
    cover_url: row.cover_url,
    media_type: row.media_type,
  });

  const events: DiaryEvent[] = [
    ...started.data.map((row) => ({
      date: row.started_at!,
      kind: "started" as const,
      entry: ref(row),
    })),
    ...finished.data.map((row) => ({
      date: row.finished_at!,
      kind: "finished" as const,
      entry: ref(row),
    })),
  ];

  for (const log of logs.data) {
    if (!log.entry) continue;
    if (log.kind === "rewatched") {
      events.push({ date: log.date, kind: "rewatched", entry: ref(log.entry) });
    } else {
      const detail = progressDetailSchema.safeParse(log.detail);
      if (detail.success) {
        events.push({ date: log.date, kind: "progress", entry: ref(log.entry), ...detail.data });
      }
    }
  }
  return events;
}
