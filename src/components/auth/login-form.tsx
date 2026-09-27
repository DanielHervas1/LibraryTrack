"use client";

import { useActionState } from "react";

import { sendMagicLink, type LoginState } from "@/lib/actions/auth";

const initialState: LoginState = { status: "idle" };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.status === "sent") {
    return (
      <p className="rounded-lg bg-surface p-4 text-sm" role="status">
        Si <strong>{state.email}</strong> tiene acceso, te hemos enviado un enlace para entrar.
        Revisa tu correo.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {next && <input type="hidden" name="next" value={next} />}
      <label htmlFor="email" className="text-sm font-medium">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className="rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
      />
      {state.status === "error" && (
        <p className="text-sm text-danger" role="alert">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviarme un enlace"}
      </button>
    </form>
  );
}
