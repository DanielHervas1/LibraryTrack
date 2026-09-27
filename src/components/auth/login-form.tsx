"use client";

import { useActionState, useState } from "react";

import { inputClass, primaryButtonClass } from "@/components/ui/styles";
import {
  sendMagicLink,
  verifyEmailCode,
  type LoginState,
  type VerifyState,
} from "@/lib/actions/auth";

const initialLogin: LoginState = { status: "idle" };
const initialVerify: VerifyState = { status: "idle" };

/** Paso 2: escribir el código recibido por correo. */
function CodeForm({ email, next, onBack }: { email: string; next?: string; onBack: () => void }) {
  const [state, formAction, pending] = useActionState(verifyEmailCode, initialVerify);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="rounded-lg bg-surface p-4 text-sm" role="status">
        Si <strong>{email}</strong> tiene acceso, te hemos enviado un correo con un{" "}
        <strong>código</strong>. Escríbelo aquí.
      </p>
      <input type="hidden" name="email" value={email} />
      {next && <input type="hidden" name="next" value={next} />}
      <label htmlFor="code" className="text-sm font-medium">
        Código
      </label>
      <input
        id="code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]*"
        maxLength={12}
        required
        autoFocus
        className={`${inputClass} text-center text-2xl tracking-[0.4em]`}
      />
      {state.status === "error" && (
        <p className="text-sm text-danger" role="alert">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Comprobando…" : "Entrar"}
      </button>
      <p className="text-xs text-muted">
        También puedes pulsar el enlace del correo. Si usas la app instalada en el iPhone, mejor el
        código: el enlace se abre en Safari, no dentro de la app.
      </p>
      <button type="button" onClick={onBack} className="text-sm text-muted hover:text-foreground">
        ← Usar otro email o pedir otro código
      </button>
    </form>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialLogin);
  // Volver al paso 1 sin recargar: se descarta ese resultado concreto (cada envío crea
  // uno nuevo, así que pedir otro código con el mismo email vuelve a mostrar el paso 2).
  const [dismissed, setDismissed] = useState<LoginState | null>(null);

  if (state.status === "sent" && state !== dismissed) {
    return <CodeForm email={state.email} next={next} onBack={() => setDismissed(state)} />;
  }

  const lastEmail = dismissed?.status === "sent" ? dismissed.email : undefined;

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
        defaultValue={lastEmail}
        className={inputClass}
      />
      {state.status === "error" && (
        <p className="text-sm text-danger" role="alert">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Enviando…" : "Enviarme un código"}
      </button>
    </form>
  );
}
