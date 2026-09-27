// Diario y calendario. Funciones puras (fechas como "YYYY-MM-DD", sin horas ni zonas).

import type { MediaType } from "@/lib/constants";

export type DiaryEntryRef = {
  id: string;
  title: string;
  cover_url: string | null;
  media_type: MediaType;
};

export type DiaryEventKind = "started" | "finished" | "progress" | "rewatched";
export type ProgressUnit = "episode" | "page";

export type DiaryEvent = {
  date: string;
  kind: DiaryEventKind;
  entry: DiaryEntryRef;
  /** Solo en "progress": episodios o páginas avanzados. */
  amount?: number;
  unit?: ProgressUnit;
};

export type YearMonth = { year: number; month: number }; // month 1-12

const pad = (value: number) => String(value).padStart(2, "0");

export function isoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** "2026-09" → { year: 2026, month: 9 }; si no es válido, el mes de `today`. */
export function parseMonth(value: unknown, today: string): YearMonth {
  const match = typeof value === "string" ? /^(\d{4})-(\d{2})$/.exec(value) : null;
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (year >= 1900 && year <= 2200 && month >= 1 && month <= 12) return { year, month };
  }
  return { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
}

export function formatMonth({ year, month }: YearMonth): string {
  return `${year}-${pad(month)}`;
}

export function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function monthRange({ year, month }: YearMonth): { from: string; to: string } {
  return { from: isoDate(year, month, 1), to: isoDate(year, month, daysInMonth(year, month)) };
}

export type CalendarDay = { date: string; day: number; inMonth: boolean };

/** Semanas del mes (lunes primero), completando con días de los meses vecinos. */
export function buildMonthGrid({ year, month }: YearMonth): CalendarDay[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7; // lunes = 0
  const total = Math.ceil((offset + daysInMonth(year, month)) / 7) * 7;

  const days: CalendarDay[] = [];
  for (let i = 0; i < total; i++) {
    const date = new Date(Date.UTC(year, month - 1, 1 - offset + i));
    days.push({
      date: isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month - 1,
    });
  }

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

const KIND_ORDER: Record<DiaryEventKind, number> = {
  finished: 0,
  rewatched: 1,
  progress: 2,
  started: 3,
};

/**
 * Une los avances del mismo día y entrada (tres "+1 episodio" → "+3 episodios"), omite
 * "Empezado" si ese día también se terminó, y ordena:
 * fecha descendente y, dentro del día, terminados primero.
 */
export function aggregateEvents(events: DiaryEvent[]): DiaryEvent[] {
  // Empezado y terminado el mismo día (una película, un libro corto): basta "Terminado".
  const finishedKeys = new Set(
    events.filter((e) => e.kind === "finished").map((e) => `${e.date}|${e.entry.id}`),
  );
  const relevant = events.filter(
    (e) => e.kind !== "started" || !finishedKeys.has(`${e.date}|${e.entry.id}`),
  );

  const merged = new Map<string, DiaryEvent>();
  for (const event of relevant) {
    const key =
      event.kind === "progress"
        ? `${event.date}|${event.entry.id}|progress|${event.unit}`
        : `${event.date}|${event.entry.id}|${event.kind}|${merged.size}`;
    const existing = merged.get(key);
    if (existing && event.kind === "progress") {
      existing.amount = (existing.amount ?? 0) + (event.amount ?? 0);
    } else {
      merged.set(key, { ...event });
    }
  }

  return [...merged.values()].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
      a.entry.title.localeCompare(b.entry.title, "es"),
  );
}

/** [fecha, eventos] en orden descendente. Espera eventos ya agregados. */
export function groupByDate(events: DiaryEvent[]): [string, DiaryEvent[]][] {
  const groups = new Map<string, DiaryEvent[]>();
  for (const event of events) groups.set(event.date, [...(groups.get(event.date) ?? []), event]);
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
}

/** Texto corto del evento: "Terminado", "+3 episodios", "Releído"… */
export function describeEvent(event: DiaryEvent): string {
  const isBook = event.entry.media_type === "book";
  switch (event.kind) {
    case "started":
      return "Empezado";
    case "finished":
      return "Terminado";
    case "rewatched":
      return isBook ? "Releído" : "Vuelto a ver";
    case "progress": {
      const amount = event.amount ?? 0;
      if (event.unit === "page") return `+${amount} ${amount === 1 ? "página" : "págs."}`;
      return `+${amount} ${amount === 1 ? "episodio" : "episodios"}`;
    }
  }
}
