import { describe, expect, it } from "vitest";

import { dedupeGenres, parseEntryForm, parseManualEntryForm, parseProgressForm } from "./entry";

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

describe("campos opcionales de la ficha", () => {
  it("solo incluye duración y autores si el formulario los envía", () => {
    const without = parseEntryForm(form(base));
    expect(without.data?.runtime_minutes).toBeUndefined();
    expect(without.data?.authors).toBeUndefined();

    const withFields = parseEntryForm(
      form({ ...base, runtime_minutes: "120", authors: "A, B, a" }),
    );
    expect(withFields.data?.runtime_minutes).toBe(120);
    expect(withFields.data?.authors).toEqual(["A", "B"]);
  });
});

describe("parseManualEntryForm", () => {
  it("crea una entrada mínima con estado por defecto", () => {
    const result = parseManualEntryForm(form({ media_type: "book", title: "Mi libro" }));
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ media_type: "book", title: "Mi libro", status: "planned" });
  });

  it("anula los campos que no aplican al tipo", () => {
    const result = parseManualEntryForm(
      form({
        media_type: "movie",
        title: "Peli",
        runtime_minutes: "95",
        total_pages: "300",
        total_episodes: "10",
        authors: "Alguien",
      }),
    );
    expect(result.data).toMatchObject({
      runtime_minutes: 95,
      total_pages: null,
      total_episodes: null,
      authors: [],
    });
  });

  it("rechaza tipos desconocidos y títulos vacíos", () => {
    expect(parseManualEntryForm(form({ media_type: "podcast", title: "X" })).success).toBe(false);
    expect(parseManualEntryForm(form({ media_type: "book", title: " " })).success).toBe(false);
  });
});

describe("parseProgressForm", () => {
  it("solo devuelve los campos enviados", () => {
    const result = parseProgressForm(form({ current_page: "120", total_pages: "300" }));
    expect(result.data).toEqual({ current_page: 120, total_pages: 300 });
  });

  it("vacío significa null", () => {
    expect(parseProgressForm(form({ total_episodes: "" })).data).toEqual({ total_episodes: null });
  });

  it("no permite superar el total", () => {
    expect(parseProgressForm(form({ current_page: "301", total_pages: "300" })).success).toBe(
      false,
    );
    expect(parseProgressForm(form({ current_episode: "13", total_episodes: "12" })).success).toBe(
      false,
    );
  });
});

describe("is_private", () => {
  it("es true solo si la casilla viene marcada", () => {
    expect(parseEntryForm(form({ ...base, is_private: "on" })).data?.is_private).toBe(true);
    expect(parseEntryForm(form(base)).data?.is_private).toBe(false);
  });
});
