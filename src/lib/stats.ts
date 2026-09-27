// Estadísticas del catálogo. Funciones puras: reciben las filas y devuelven números.

import { MEDIA_TYPES, STATUSES, type EntryStatus, type MediaType } from "@/lib/constants";
import { hasEpisodes, progressStateFromRow, watchedEpisodes } from "@/lib/progress";
import type { Json } from "@/types/database";

export type StatsEntry = {
  media_type: MediaType;
  status: EntryStatus;
  score: number | null;
  genres: string[];
  tags: string[];
  runtime_minutes: number | null;
  episode_minutes: number | null;
  total_episodes: number | null;
  current_season: number | null;
  current_episode: number | null;
  current_page: number | null;
  total_pages: number | null;
  rewatch_count: number;
  finished_at: string | null;
  metadata: Json;
};

export const DEFAULT_MINUTES_PER_PAGE = 1.5;

/**
 * Minutos consumidos de una entrada (null si falta la duración para calcularlo).
 * Películas: solo cuentan si están terminadas. Series/anime: episodios vistos × duración.
 * Libros: páginas leídas × minutos por página (estimación). Los rewatches suman el total.
 */
export function consumedMinutes(entry: StatsEntry, minutesPerPage: number): number | null {
  const completed = entry.status === "completed";
  const repeats = entry.rewatch_count;

  if (entry.media_type === "movie") {
    if (!completed && repeats === 0) return 0;
    if (!entry.runtime_minutes) return null;
    return entry.runtime_minutes * ((completed ? 1 : 0) + repeats);
  }

  if (hasEpisodes(entry.media_type)) {
    const watched = completed
      ? (entry.total_episodes ?? watchedEpisodes(progressStateFromRow(entry)))
      : watchedEpisodes(progressStateFromRow(entry));
    const episodes = watched + repeats * (entry.total_episodes ?? 0);
    if (episodes === 0) return 0;
    if (!entry.episode_minutes) return null;
    return episodes * entry.episode_minutes;
  }

  const pagesRead = completed
    ? (entry.total_pages ?? entry.current_page ?? 0)
    : (entry.current_page ?? 0);
  const pages = pagesRead + repeats * (entry.total_pages ?? 0);
  return pages * minutesPerPage;
}

export type CountItem = { name: string; count: number; averageScore: number | null };
export type MonthCount = { month: string; count: number };

export type Stats = {
  total: number;
  byType: Record<MediaType, number>;
  byStatus: Record<EntryStatus, number>;
  minutesByType: Record<MediaType, number>;
  totalMinutes: number;
  /** Entradas con consumo pero sin duración conocida (no suman horas). */
  missingDuration: number;
  averageScore: number | null;
  averageScoreByType: Record<MediaType, number | null>;
  /** Índice 0 = nota 1 … índice 9 = nota 10. */
  scoreDistribution: number[];
  topGenres: CountItem[];
  topTags: CountItem[];
  completedByMonth: MonthCount[];
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function zeroRecord<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
}

/** Frecuencia de etiquetas (géneros o tags) con la nota media de sus entradas. */
function topItems(entries: StatsEntry[], pick: (entry: StatsEntry) => string[], limit: number) {
  const items = new Map<string, { count: number; scores: number[] }>();
  for (const entry of entries) {
    for (const name of pick(entry)) {
      const item = items.get(name) ?? { count: 0, scores: [] };
      item.count += 1;
      if (entry.score !== null) item.scores.push(entry.score);
      items.set(name, item);
    }
  }
  return [...items.entries()]
    .map(([name, item]) => ({ name, count: item.count, averageScore: average(item.scores) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"))
    .slice(0, limit);
}

/** Meses "YYYY-MM" a mostrar: los 12 del año elegido, o los 12 últimos hasta `today`. */
export function monthsFor(year: number | undefined, today: string): string[] {
  if (year)
    return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const current = Number(today.slice(0, 4)) * 12 + Number(today.slice(5, 7)) - 1;
  return Array.from({ length: 12 }, (_, i) => {
    const index = current - 11 + i;
    return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
  });
}

/** Años con algo terminado, del más reciente al más antiguo. */
export function yearsWithActivity(entries: Pick<StatsEntry, "finished_at">[]): number[] {
  const years = new Set(
    entries
      .filter((entry) => entry.finished_at)
      .map((entry) => Number(entry.finished_at!.slice(0, 4))),
  );
  return [...years].sort((a, b) => b - a);
}

export type StatsOptions = {
  minutesPerPage: number;
  /** "Mi año": solo lo terminado ese año. */
  year?: number;
  today: string;
};

export function computeStats(allEntries: StatsEntry[], options: StatsOptions): Stats {
  const entries = options.year
    ? allEntries.filter((entry) => entry.finished_at?.startsWith(`${options.year}-`))
    : allEntries;

  const byType = zeroRecord(MEDIA_TYPES);
  const byStatus = zeroRecord(STATUSES);
  const minutesByType = zeroRecord(MEDIA_TYPES);
  const scores: number[] = [];
  const scoresByType = Object.fromEntries(
    MEDIA_TYPES.map((type) => [type, [] as number[]]),
  ) as Record<MediaType, number[]>;
  const scoreDistribution = Array.from({ length: 10 }, () => 0);
  let missingDuration = 0;

  for (const entry of entries) {
    byType[entry.media_type] += 1;
    byStatus[entry.status] += 1;

    const minutes = consumedMinutes(entry, options.minutesPerPage);
    if (minutes === null) missingDuration += 1;
    else minutesByType[entry.media_type] += minutes;

    if (entry.score !== null) {
      scores.push(entry.score);
      scoresByType[entry.media_type].push(entry.score);
      scoreDistribution[entry.score - 1] += 1;
    }
  }

  const months = monthsFor(options.year, options.today);
  const completed = new Map(months.map((month) => [month, 0]));
  for (const entry of allEntries) {
    const month = entry.finished_at?.slice(0, 7);
    if (month && completed.has(month)) completed.set(month, (completed.get(month) ?? 0) + 1);
  }

  return {
    total: entries.length,
    byType,
    byStatus,
    minutesByType,
    totalMinutes: Object.values(minutesByType).reduce((sum, value) => sum + value, 0),
    missingDuration,
    averageScore: average(scores),
    averageScoreByType: Object.fromEntries(
      MEDIA_TYPES.map((type) => [type, average(scoresByType[type])]),
    ) as Record<MediaType, number | null>,
    scoreDistribution,
    topGenres: topItems(entries, (entry) => entry.genres, 8),
    topTags: topItems(entries, (entry) => entry.tags, 8),
    completedByMonth: months.map((month) => ({ month, count: completed.get(month) ?? 0 })),
  };
}

/** 125 → "2 h 5 min"; 6000 → "100 h". */
export function formatHours(minutes: number): string {
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  if (hours === 0) return `${rest} min`;
  if (hours >= 100 || rest === 0) return `${hours.toLocaleString("es-ES")} h`;
  return `${hours} h ${rest} min`;
}
