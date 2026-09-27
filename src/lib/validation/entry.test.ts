import { describe, expect, it } from "vitest";

import { dedupeGenres, parseEntryForm } from "./entry";

function form(values: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  }
  return data;
}

const base = { title: "Dune", status: "completed" };

describe("parseEntryForm", () => {
  it("convierte campos vacíos en null", () => {
    const result = parseEntryForm(
      form({ ...base, score: "", review: "  ", started_at: "", finished_at: "" }),
    );
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      score: null,
      review: null,
      started_at: null,
      finished_at: null,
      genres: [],
    });
  });

  it("acepta una entrada completa", () => {
    const result = parseEntryForm(
      form({
        ...base,
        score: "8",
        review: "Muy buena",
        started_at: "2026-09-01",
        finished_at: "2026-09-02",
        genres: ["Ciencia ficción", "Aventura"],
      }),
    );
    expect(result.success).toBe(true);
    expect(result.data?.score).toBe(8);
    expect(result.data?.genres).toEqual(["Ciencia ficción", "Aventura"]);
  });

  it("rechaza notas fuera de 1-10", () => {
    expect(parseEntryForm(form({ ...base, score: "11" })).success).toBe(false);
    expect(parseEntryForm(form({ ...base, score: "0" })).success).toBe(false);
    expect(parseEntryForm(form({ ...base, score: "7.5" })).success).toBe(false);
  });

  it("rechaza estados desconocidos y títulos vacíos", () => {
    expect(parseEntryForm(form({ ...base, status: "watching" })).success).toBe(false);
    expect(parseEntryForm(form({ ...base, title: "   " })).success).toBe(false);
  });

  it("rechaza una fecha de fin anterior a la de inicio", () => {
    const result = parseEntryForm(
      form({ ...base, started_at: "2026-09-10", finished_at: "2026-09-01" }),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["finished_at"]);
  });
});

describe("dedupeGenres", () => {
  it("quita duplicados sin distinguir mayúsculas", () => {
    expect(dedupeGenres(["Drama", "drama", "Acción", "DRAMA"])).toEqual(["Drama", "Acción"]);
  });
});
