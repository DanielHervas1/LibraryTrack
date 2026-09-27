import { describe, expect, it } from "vitest";

import {
  aggregateEvents,
  buildMonthGrid,
  describeEvent,
  groupByDate,
  monthRange,
  parseMonth,
  shiftMonth,
  type DiaryEvent,
} from "./diary";

const serie = { id: "s", title: "Breaking Bad", cover_url: null, media_type: "tv" as const };
const libro = {
  id: "l",
  title: "El nombre del viento",
  cover_url: null,
  media_type: "book" as const,
};

describe("meses", () => {
  it("parseMonth acepta YYYY-MM y cae al mes actual si no es válido", () => {
    expect(parseMonth("2026-02", "2026-09-27")).toEqual({ year: 2026, month: 2 });
    expect(parseMonth("2026-13", "2026-09-27")).toEqual({ year: 2026, month: 9 });
    expect(parseMonth(undefined, "2026-09-27")).toEqual({ year: 2026, month: 9 });
  });

  it("shiftMonth cruza años", () => {
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("monthRange conoce los años bisiestos", () => {
    expect(monthRange({ year: 2028, month: 2 })).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(monthRange({ year: 2026, month: 2 }).to).toBe("2026-02-28");
  });
});

describe("buildMonthGrid", () => {
  it("empieza en lunes y rellena con días de los meses vecinos", () => {
    // Septiembre de 2026 empieza en martes.
    const weeks = buildMonthGrid({ year: 2026, month: 9 });
    expect(weeks[0][0]).toEqual({ date: "2026-08-31", day: 31, inMonth: false });
    expect(weeks[0][1]).toEqual({ date: "2026-09-01", day: 1, inMonth: true });
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks.flat().filter((day) => day.inMonth)).toHaveLength(30);
  });
});

describe("aggregateEvents", () => {
  it("suma los avances del mismo día y entrada y ordena por fecha y tipo", () => {
    const events: DiaryEvent[] = [
      { date: "2026-09-01", kind: "progress", entry: serie, amount: 1, unit: "episode" },
      { date: "2026-09-01", kind: "progress", entry: serie, amount: 2, unit: "episode" },
      { date: "2026-09-01", kind: "finished", entry: libro },
      { date: "2026-09-02", kind: "started", entry: libro },
    ];
    const result = aggregateEvents(events);
    expect(result.map((e) => [e.date, e.kind, e.amount])).toEqual([
      ["2026-09-02", "started", undefined],
      ["2026-09-01", "finished", undefined],
      ["2026-09-01", "progress", 3],
    ]);
  });

  it("no mezcla dos rewatches del mismo día", () => {
    const events: DiaryEvent[] = [
      { date: "2026-09-01", kind: "rewatched", entry: serie },
      { date: "2026-09-01", kind: "rewatched", entry: serie },
    ];
    expect(aggregateEvents(events)).toHaveLength(2);
  });
});

describe("groupByDate y describeEvent", () => {
  it("agrupa por día en orden descendente", () => {
    const events = aggregateEvents([
      { date: "2026-09-01", kind: "started", entry: serie },
      { date: "2026-09-03", kind: "finished", entry: serie },
    ]);
    expect(groupByDate(events).map(([date]) => date)).toEqual(["2026-09-03", "2026-09-01"]);
  });

  it("describe cada evento según el tipo", () => {
    expect(
      describeEvent({ date: "", kind: "progress", entry: libro, amount: 45, unit: "page" }),
    ).toBe("+45 págs.");
    expect(
      describeEvent({ date: "", kind: "progress", entry: serie, amount: 1, unit: "episode" }),
    ).toBe("+1 episodio");
    expect(describeEvent({ date: "", kind: "rewatched", entry: libro })).toBe("Releído");
    expect(describeEvent({ date: "", kind: "rewatched", entry: serie })).toBe("Vuelto a ver");
  });
});

describe("empezado y terminado el mismo día", () => {
  it("solo deja Terminado", () => {
    const events = aggregateEvents([
      { date: "2026-09-01", kind: "started", entry: serie },
      { date: "2026-09-01", kind: "finished", entry: serie },
      { date: "2026-09-01", kind: "started", entry: libro },
    ]);
    expect(events.map((e) => `${e.entry.id}:${e.kind}`)).toEqual(["s:finished", "l:started"]);
  });
});
