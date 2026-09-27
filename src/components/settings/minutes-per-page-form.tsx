"use client";

import { useActionState } from "react";

import { secondaryButtonClass } from "@/components/ui/styles";
import type { ActionState } from "@/lib/actions/entries";
import { setMinutesPerPage } from "@/lib/actions/profile";

const initialState: ActionState = { status: "idle" };

/** Minutos por página para estimar las horas de lectura. */
export function MinutesPerPageForm({ value }: { value: number }) {
  const [state, formAction, pending] = useActionState(setMinutesPerPage, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="number"
          name="minutes_per_page"
          step="0.1"
          min="0.2"
          max="10"
          inputMode="decimal"
          defaultValue={value}
          className="w-20 rounded-lg border border-border bg-background px-2 py-1.5"
        />
        minutos por página
      </label>
      <button type="submit" disabled={pending} className={secondaryButtonClass}>
        {pending ? "Guardando…" : "Guardar"}
      </button>
      <span aria-live="polite" className="text-sm">
        {!pending && state.status === "saved" && <span className="text-muted">Guardado ✓</span>}
        {!pending && state.status === "error" && (
          <span className="text-danger">{state.message}</span>
        )}
      </span>
    </form>
  );
}
