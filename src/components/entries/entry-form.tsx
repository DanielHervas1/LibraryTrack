"use client";

import { useActionState } from "react";

import { inputClass, primaryButtonClass } from "@/components/ui/styles";
import { updateEntry, type ActionState } from "@/lib/actions/entries";
import { STATUSES, statusLabel, type EntryStatus } from "@/lib/constants";
import type { Entry } from "@/lib/db/entries";
import { useSyncedState } from "@/lib/hooks/use-synced-state";

import { GenreEditor } from "./genre-editor";
import { ScoreInput } from "./score-input";

const initialState: ActionState = { status: "idle" };

const AUTHORS_LABEL = { book: "Autores", tv: "Creadores", anime: "Estudio" } as const;

export function EntryForm({ entry }: { entry: Entry }) {
  const [state, formAction, pending] = useActionState(
    updateEntry.bind(null, entry.id),
    initialState,
  );

  // Otras acciones (progreso, "marcar completado") pueden cambiar estos campos en el
  // servidor; se sincronizan para no sobrescribirlos con valores viejos al guardar.
  const [status, setStatus] = useSyncedState<EntryStatus>(entry.status);
  const [startedAt, setStartedAt] = useSyncedState(entry.started_at ?? "");
  const [finishedAt, setFinishedAt] = useSyncedState(entry.finished_at ?? "");

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
        <select
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as EntryStatus)}
          className={inputClass}
        >
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {statusLabel(value, entry.media_type)}
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
            value={startedAt}
            onChange={(event) => setStartedAt(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Fin</span>
          <input
            type="date"
            name="finished_at"
            value={finishedAt}
            onChange={(event) => setFinishedAt(event.target.value)}
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

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="is_private"
          defaultChecked={entry.is_private}
          className="mt-0.5 accent-accent"
        />
        <span>
          Privada
          <span className="block text-xs text-muted">No aparece en tu perfil compartido.</span>
        </span>
      </label>

      {entry.media_type === "movie" ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Duración (min)</span>
          <input
            type="number"
            name="runtime_minutes"
            min={1}
            max={2000}
            inputMode="numeric"
            defaultValue={entry.runtime_minutes ?? ""}
            className={inputClass}
          />
        </label>
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{AUTHORS_LABEL[entry.media_type]}</span>
          <input
            name="authors"
            defaultValue={entry.authors.join(", ")}
            placeholder="Separados por comas"
            maxLength={1000}
            className={inputClass}
          />
        </label>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
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
