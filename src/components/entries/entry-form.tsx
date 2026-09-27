"use client";

import { useActionState } from "react";

import { updateEntry, type ActionState } from "@/lib/actions/entries";
import { STATUSES, statusLabel } from "@/lib/constants";
import type { Entry } from "@/lib/db/entries";

import { GenreEditor } from "./genre-editor";
import { ScoreInput } from "./score-input";

const initialState: ActionState = { status: "idle" };

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-accent";

export function EntryForm({ entry }: { entry: Entry }) {
  const [state, formAction, pending] = useActionState(
    updateEntry.bind(null, entry.id),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Título</span>
        <input
          name="title"
          defaultValue={entry.title}
          required
          maxLength={500}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Estado</span>
        <select name="status" defaultValue={entry.status} className={inputClass}>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status, entry.media_type)}
            </option>
          ))}
        </select>
      </label>

      <ScoreInput initialScore={entry.score} />

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Inicio</span>
          <input
            type="date"
            name="started_at"
            defaultValue={entry.started_at ?? ""}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Fin</span>
          <input
            type="date"
            name="finished_at"
            defaultValue={entry.finished_at ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Mi opinión</span>
        <textarea
          name="review"
          defaultValue={entry.review ?? ""}
          rows={5}
          maxLength={10_000}
          placeholder="¿Qué te pareció?"
          className={inputClass}
        />
      </label>

      <GenreEditor initialGenres={entry.genres} />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <p aria-live="polite" className="text-sm">
          {!pending && state.status === "saved" && <span className="text-muted">Guardado ✓</span>}
          {!pending && state.status === "error" && (
            <span className="text-danger">{state.message}</span>
          )}
        </p>
      </div>
    </form>
  );
}
