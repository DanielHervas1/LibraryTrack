"use client";

import { useState } from "react";

/** Editor de géneros como etiquetas. Envía un input oculto "genres" por cada uno. */
export function GenreEditor({ initialGenres }: { initialGenres: string[] }) {
  const [genres, setGenres] = useState(initialGenres);
  const [draft, setDraft] = useState("");

  function addDraft() {
    const value = draft.trim();
    if (!value) return;
    const exists = genres.some(
      (genre) => genre.toLocaleLowerCase("es") === value.toLocaleLowerCase("es"),
    );
    if (!exists) setGenres([...genres, value]);
    setDraft("");
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">Géneros</legend>
      {genres.map((genre) => (
        <input key={genre} type="hidden" name="genres" value={genre} />
      ))}
      <ul className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <li
            key={genre}
            className="flex items-center gap-1 rounded-full bg-surface py-1 pr-1 pl-3 text-sm"
          >
            {genre}
            <button
              type="button"
              onClick={() => setGenres(genres.filter((g) => g !== genre))}
              aria-label={`Quitar ${genre}`}
              className="flex size-5 items-center justify-center rounded-full text-muted hover:bg-border hover:text-foreground"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addDraft();
            }
          }}
          placeholder="Añadir género"
          aria-label="Nuevo género"
          maxLength={60}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="button"
          onClick={addDraft}
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface"
        >
          Añadir
        </button>
      </div>
    </fieldset>
  );
}
