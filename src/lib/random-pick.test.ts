import { describe, expect, it } from "vitest";

import { filterCandidates, pickRandom, type PickCandidate } from "./random-pick";

const items: PickCandidate[] = [
  { id: "peli-corta", media_type: "movie", runtime_minutes: 90, episode_minutes: null },
  { id: "peli-larga", media_type: "movie", runtime_minutes: 180, episode_minutes: null },
  { id: "serie", media_type: "tv", runtime_minutes: null, episode_minutes: 45 },
  { id: "anime-sin-duracion", media_type: "anime", runtime_minutes: null, episode_minutes: null },
  { id: "libro", media_type: "book", runtime_minutes: null, episode_minutes: null },
];

const ids = (list: PickCandidate[]) => list.map((item) => item.id);

describe("filterCandidates", () => {
  it("sin filtros devuelve todo", () => {
    expect(filterCandidates(items, {})).toHaveLength(items.length);
  });

  it("filtra por tipo", () => {
    expect(ids(filterCandidates(items, { mediaType: "movie" }))).toEqual([
      "peli-corta",
      "peli-larga",
    ]);
  });

  it("filtra por duración máxima (película o episodio) y excluye lo desconocido y los libros", () => {
    expect(ids(filterCandidates(items, { maxMinutes: 100 }))).toEqual(["peli-corta", "serie"]);
  });
});

describe("pickRandom", () => {
  it("usa el generador inyectado", () => {
    expect(pickRandom(items, null, () => 0)?.id).toBe("peli-corta");
    expect(pickRandom(items, null, () => 0.99)?.id).toBe("libro");
  });

  it("evita repetir el anterior si hay alternativas", () => {
    expect(pickRandom(items.slice(0, 2), "peli-corta", () => 0)?.id).toBe("peli-larga");
  });

  it("repite si solo hay una opción", () => {
    expect(pickRandom(items.slice(0, 1), "peli-corta", () => 0)?.id).toBe("peli-corta");
  });

  it("null si no hay nada", () => {
    expect(pickRandom([], null)).toBeNull();
  });
});
