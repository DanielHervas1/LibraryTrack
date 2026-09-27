"use client";

import { useActionState, useState } from "react";

import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/styles";
import { sendMagicLink, signInWithPassword, type FormState } from "@/lib/actions/auth";

const initialState: FormState = { status: "idle" };

function ErrorMessage({ state }: { state: FormState }) {
  if (state.status !== "error") return null;
  return (
    <p className="text-sm text-danger" role="alert">
      {state.message}
    </p>
  );
}

/** Primera vez o contraseña olvidada: enlace por email que lleva a Ajustes → Contraseña. */
function MagicLinkForm({ onBack }: { onBack: () => void }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-lg bg-surface p-4 text-sm" role="status">
          Si <strong>{state.email}</strong> tiene acceso, te hemos enviado un enlace.{" "}
          <strong>Ábrelo en este mismo navegador</strong> (en Android, en Chrome; si el correo lo
          abre en otra app, usa “Abrir en Chrome”). Te llevará a Ajustes para crear tu contraseña.
        </p>
        <button type="button" onClick={onBack} className="text-sm text-muted hover:text-foreground">
          ← Volver a entrar con contraseña
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Te enviaremos un enlace de acceso. Una vez dentro podrás crear o cambiar tu contraseña.
      </p>
      <label htmlFor="link-email" className="text-sm font-medium">
        Email
      </label>
      <input
        id="link-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className={inputClass}
      />
      <ErrorMessage state={state} />
      <button type="submit" disabled={pending} className={secondaryButtonClass}>
        {pending ? "Enviando…" : "Enviarme un enlace"}
      </button>
      <button type="button" onClick={onBack} className="text-sm text-muted hover:text-foreground">
        ← Volver a entrar con contraseña
      </button>
    </form>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signInWithPassword, initialState);
  const [useLink, setUseLink] = useState(false);

  if (useLink) return <MagicLinkForm onBack={() => setUseLink(false)} />;

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
        autoComplete="username"
        required
        className={inputClass}
      />
      <label htmlFor="password" className="text-sm font-medium">
        Contraseña
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className={inputClass}
      />
      <ErrorMessage state={state} />
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <button
        type="button"
        onClick={() => setUseLink(true)}
        className="text-sm text-muted hover:text-foreground"
      >
        ¿Primera vez o has olvidado la contraseña? Entrar con un enlace por email
      </button>
    </form>
  );
}
