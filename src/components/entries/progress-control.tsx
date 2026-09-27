"use client";

import { useActionState, useState, useTransition } from "react";

import { inputClass, secondaryButtonClass } from "@/components/ui/styles";
import type { ActionState } from "@/lib/actions/entries";
import {
  advanceEpisode,
  advancePages,
  markCompleted,
  updateProgress,
} from "@/lib/actions/progress";
import type { EntryStatus } from "@/lib/constants";
import {
  describeProgress,
  hasEpisodes,
  isProgressComplete,
  nextEpisode,
  progressRatio,
  type ProgressState,
} from "@/lib/progress";

type ProgressControlProps = {
  entryId: string;
  status: EntryStatus;
  progress: ProgressState;
  episodeMinutes: number | null;
};

const initialState: ActionState = { status: "idle" };

function NumberInput({
  name,
  label,
  defaultValue,
  min = 0,
}: {
  name: string;
  label: string;
  defaultValue: number | null;
  min?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <input
        type="number"
        name={name}
        min={min}
        inputMode="numeric"
        defaultValue={defaultValue ?? ""}
        className={inputClass}
      />
    </label>
  );
}

function ProgressEditor({
  entryId,
  progress,
  episodeMinutes,
  onDone,
}: ProgressControlProps & { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await updateProgress(entryId, prev, formData);
      if (result.status === "saved") onDone();
      return result;
    },
    initialState,
  );

  const isTv = progress.mediaType === "tv";

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {hasEpisodes(progress.mediaType) ? (
          <>
            {isTv && (
              <NumberInput
                name="current_season"
                label="Temporada"
                defaultValue={progress.currentSeason}
              />
            )}
            <NumberInput
              name="current_episode"
              label="Episodio"
              defaultValue={progress.currentEpisode}
            />
            <NumberInput
              name="total_episodes"
              label="Episodios totales"
              defaultValue={progress.totalEpisodes}
              min={1}
            />
            <NumberInput
              name="episode_minutes"
              label="Min. por episodio"
              defaultValue={episodeMinutes}
              min={1}
            />
          </>
        ) : (
          <>
            <NumberInput name="current_page" label="Página" defaultValue={progress.currentPage} />
            <NumberInput
              name="total_pages"
              label="Páginas totales"
              defaultValue={progress.totalPages}
              min={1}
            />
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={secondaryButtonClass}>
          {pending ? "Guardando…" : "Guardar progreso"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-muted hover:text-foreground">
          Cancelar
        </button>
        {state.status === "error" && (
          <p className="text-sm text-danger" role="alert">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

/** Progreso de series, anime y libros: barra, botones rápidos y edición exacta. */
export function ProgressControl(props: ProgressControlProps) {
  const { entryId, status, progress } = props;
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const ratio = progressRatio(progress);
  const label = describeProgress(progress) ?? "Sin empezar";
  const complete = isProgressComplete(progress);
  const episodes = hasEpisodes(progress.mediaType);
  const canAdvance = episodes ? nextEpisode(progress) !== null : !complete;
  // Se ofrece completar al llegar al final (con los botones rápidos o editando a mano).
  const suggestComplete = complete && status !== "completed";

  function run(action: () => Promise<ActionState>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.status === "error") setMessage(result.message);
    });
  }

  return (
    <section aria-label="Progreso" className="flex flex-col gap-3 rounded-xl bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium">Progreso</h2>
        <p className="text-sm text-muted">
          {label}
          {ratio !== null && ` · ${Math.round(ratio * 100)} %`}
        </p>
      </div>

      {ratio !== null && (
        <div
          className="h-2 overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(ratio * 100)}
        >
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      )}

      {suggestComplete && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-accent/10 p-3 text-sm">
          <span>¡Has llegado al final!</span>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => markCompleted(entryId))}
            className="rounded-lg bg-accent px-3 py-1.5 font-medium text-accent-foreground disabled:opacity-60"
          >
            Marcar como completado
          </button>
        </div>
      )}

      {editing ? (
        <ProgressEditor
          key={`${progress.currentSeason}-${progress.currentEpisode}-${progress.currentPage}`}
          {...props}
          onDone={() => setEditing(false)}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {episodes ? (
            <button
              type="button"
              disabled={pending || !canAdvance}
              onClick={() => run(() => advanceEpisode(entryId))}
              className={secondaryButtonClass}
            >
              +1 episodio
            </button>
          ) : (
            [10, 25, 50].map((amount) => (
              <button
                key={amount}
                type="button"
                disabled={pending || !canAdvance}
                onClick={() => run(() => advancePages(entryId, amount))}
                className={secondaryButtonClass}
              >
                +{amount} págs.
              </button>
            ))
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-2 text-sm text-muted hover:text-foreground"
          >
            Editar
          </button>
        </div>
      )}

      {message && (
        <p className="text-sm text-danger" role="alert">
          {message}
        </p>
      )}
    </section>
  );
}
