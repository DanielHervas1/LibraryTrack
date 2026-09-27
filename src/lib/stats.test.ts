import { describe, expect, it } from "vitest";

import {
  computeStats,
  consumedMinutes,
  formatHours,
  monthsFor,
  yearsWithActivity,
  type StatsEntry,
} from "./stats";

const base: StatsEntry = {
  media_type: "movie",
  status: "completed",
  score: null,
  genres: [],
  tags: [],
  runtime_minutes: null,
  episode_minutes: null,
  total_episodes: null,
  current_season: null,
  current_episode: null,
  current_page: null,
  total_pages: null,
  rewatch_count: 0,
  finished_at: null,
  metadata: {},
};

const movie = (overrides: Partial<StatsEntry> = {}): StatsEntry => ({
  ...base,
  runtime_minutes: 120,
  ...overrides,
});

describe("consumedMinutes", () => {
  it("películas: solo terminadas, más los rewatches", () => {
    expect(consumedMinutes(movie(), 1.5)).toBe(120);
    expect(consumedMinutes(movie({ rewatch_count: 2 }), 1.5)).toBe(360);
    expect(consumedMinutes(movie({ status: "planned" }), 1.5)).toBe(0);
    expect(consumedMinutes(movie({ runtime_minutes: null }), 1.5)).toBeNull();
  });

  it("series: episodios vistos (sumando temporadas) × duración", () => {
    const serie: StatsEntry = {
      ...base,
      media_type: "tv",
      status: "in_progress",
      episode_minutes: 50,
      total_episodes: 20,
      current_season: 2,
      current_episode: 3,
      metadata: {
        seasons: [
          { number: 1, episodes: 7 },
          { number: 2, episodes: 13 },
        ],
      },
    };
    expect(consumedMinutes(serie, 1.5)).toBe(10 * 50);
    expect(consumedMinutes({ ...serie, status: "completed" }, 1.5)).toBe(20 * 50);
    expect(consumedMinutes({ ...serie, episode_minutes: null }, 1.5)).toBeNull();
  });

  it("libros: páginas × minutos por página", () => {
    const book: StatsEntry = {
      ...base,
      media_type: "book",
      status: "in_progress",
      current_page: 100,
      total_pages: 300,
    };
    expect(consumedMinutes(book, 2)).toBe(200);
    expect(consumedMinutes({ ...book, status: "completed", rewatch_count: 1 }, 1)).toBe(600);
  });
});

describe("computeStats", () => {
  const entries: StatsEntry[] = [
    movie({ score: 8, genres: ["Drama"], tags: ["cine"], finished_at: "2026-03-10" }),
    movie({ score: 6, genres: ["Drama", "Crimen"], finished_at: "2025-12-01" }),
    { ...base, media_type: "book", status: "planned", genres: ["Fantasía"] },
  ];

  it("cuenta por tipo y estado, horas y notas", () => {
    const stats = computeStats(entries, { minutesPerPage: 1.5, today: "2026-09-27" });
    expect(stats.total).toBe(3);
    expect(stats.byType).toMatchObject({ movie: 2, book: 1, tv: 0 });
    expect(stats.byStatus).toMatchObject({ completed: 2, planned: 1 });
    expect(stats.minutesByType.movie).toBe(240);
    expect(stats.averageScore).toBe(7);
    expect(stats.averageScoreByType.book).toBeNull();
    expect(stats.scoreDistribution[7]).toBe(1);
    expect(stats.topGenres[0]).toEqual({ name: "Drama", count: 2, averageScore: 7 });
  });

  it("con año, solo cuenta lo terminado ese año", () => {
    const stats = computeStats(entries, { minutesPerPage: 1.5, year: 2026, today: "2026-09-27" });
    expect(stats.total).toBe(1);
    expect(stats.completedByMonth).toHaveLength(12);
    expect(stats.completedByMonth[2]).toEqual({ month: "2026-03", count: 1 });
  });

  it("sin año, los 12 últimos meses", () => {
    const stats = computeStats(entries, { minutesPerPage: 1.5, today: "2026-09-27" });
    expect(stats.completedByMonth[0].month).toBe("2025-10");
    expect(stats.completedByMonth.at(-1)?.month).toBe("2026-09");
    expect(stats.completedByMonth.find((m) => m.month === "2025-12")?.count).toBe(1);
  });

  it("cuenta las entradas sin duración aparte", () => {
    const stats = computeStats([movie({ runtime_minutes: null })], {
      minutesPerPage: 1.5,
      today: "2026-09-27",
    });
    expect(stats.missingDuration).toBe(1);
    expect(stats.totalMinutes).toBe(0);
  });
});

describe("utilidades", () => {
  it("monthsFor cruza el cambio de año", () => {
    expect(monthsFor(undefined, "2026-02-10").slice(0, 2)).toEqual(["2025-03", "2025-04"]);
  });

  it("yearsWithActivity, del más reciente al más antiguo", () => {
    expect(
      yearsWithActivity([
        { finished_at: "2025-01-01" },
        { finished_at: null },
        { finished_at: "2026-05-01" },
      ]),
    ).toEqual([2026, 2025]);
  });

  it("formatHours", () => {
    expect(formatHours(45)).toBe("45 min");
    expect(formatHours(125)).toBe("2 h 5 min");
    expect(formatHours(120)).toBe("2 h");
    expect(formatHours(6000)).toBe("100 h");
  });
});
