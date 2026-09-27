import { describe, expect, it } from "vitest";

import { buildExportJson, entriesToCsv, exportFilename, type ExportEntry } from "./export";

const entry: ExportEntry = {
  id: "e1",
  media_type: "movie",
  status: "completed",
  provider: "tmdb",
  external_id: "438631",
  title: "Dune",
  original_title: null,
  synopsis: "Arena, especia y gusanos",
  cover_url: "https://image.tmdb.org/t/p/w500/x.jpg",
  release_year: 2021,
  genres: ["Ciencia ficción", "Aventura"],
  score: 9,
  review: 'Enorme, "épica"',
  started_at: "2026-09-01",
  finished_at: "2026-09-01",
  is_favorite: true,
  is_private: false,
  priority: null,
  rewatch_count: 1,
  runtime_minutes: 155,
  current_season: null,
  current_episode: null,
  total_episodes: null,
  episode_minutes: null,
  current_page: null,
  total_pages: null,
  authors: [],
  metadata: {},
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-02T10:00:00Z",
  tags: ["infravalorada", "cine"],
  rewatch_dates: ["2026-09-20"],
};

describe("buildExportJson", () => {
  it("incluye cabecera y entradas", () => {
    const json = buildExportJson([entry], new Date("2026-09-27T12:00:00Z"));
    expect(json).toMatchObject({
      app: "LibraryTrack",
      version: 1,
      exported_at: "2026-09-27T12:00:00.000Z",
      count: 1,
    });
    expect(json.entries[0].tags).toEqual(["infravalorada", "cine"]);
  });
});

describe("entriesToCsv", () => {
  it("genera una fila por entrada con listas unidas", () => {
    const csv = entriesToCsv([entry]);
    const [header, row] = csv.replace("﻿", "").split("\r\n");
    expect(header.startsWith("id,tipo,titulo,")).toBe(true);
    expect(row).toContain("Ciencia ficción; Aventura");
    expect(row).toContain("infravalorada; cine");
    expect(row).toContain('"Enorme, ""épica"""');
  });
});

describe("exportFilename", () => {
  it("usa la fecha y la extensión", () => {
    expect(exportFilename("csv", "2026-09-27")).toBe("librarytrack-2026-09-27.csv");
  });
});
