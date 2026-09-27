"use client";

import { useActionState } from "react";

import { inputClass, primaryButtonClass } from "@/components/ui/styles";
import { setPassword, type FormState } from "@/lib/actions/auth";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password";

const initialState: FormState = { status: "idle" };

/** Crear o cambiar la contraseña (Ajustes). */
export function PasswordForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(setPassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {/* Para que el gestor de contraseñas del navegador asocie la clave a este email. */}
      <input type="hidden" name="username" autoComplete="username" value={email} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Nueva contraseña</span>
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Repítela</span>
        <input
          type="password"
          name="confirmation"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          className={inputClass}
        />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Guardando…" : "Guardar contraseña"}
        </button>
        <p aria-live="polite" className="text-sm">
          {!pending && state.status === "saved" && (
            <span className="text-muted">Guardada ✓ Ya puedes entrar con ella.</span>
          )}
          {!pending && state.status === "error" && (
            <span className="text-danger">{state.message}</span>
          )}
        </p>
      </div>
    </form>
  );
}
