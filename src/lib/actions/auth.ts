"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isAllowedEmail, normalizeEmail } from "@/lib/auth/allowlist";
import { sendErrorMessage, setPasswordErrorMessage, signInErrorMessage } from "@/lib/auth/errors";
import { checkNewPassword } from "@/lib/auth/password";
import { safeNextPath } from "@/lib/auth/redirect";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";

export type FormState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "saved" }
  | { status: "error"; message: string };

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

/** Método principal: email + contraseña. Funciona igual dentro de la app instalada. */
export async function signInWithPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: "Escribe tu email y tu contraseña." };
  }

  const email = normalizeEmail(parsed.data.email);
  // Mismo mensaje que una contraseña incorrecta: no revela qué email tiene acceso.
  if (!isAllowedEmail(email, process.env.ALLOWED_EMAIL)) {
    return { status: "error", message: signInErrorMessage(null) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });
  if (error) {
    // No se registra el error completo: podría incluir datos del intento.
    console.error("signInWithPassword", error.code ?? error.status);
    return { status: "error", message: signInErrorMessage(error) };
  }

  redirect(safeNextPath(parsed.data.next));
}

const emailSchema = z.object({ email: z.email() });

/**
 * Enlace de acceso por email, para la primera vez o si se olvida la contraseña.
 * Lleva a Ajustes para crearla. El enlace (PKCE) solo funciona en el navegador donde se pidió.
 */
export async function sendMagicLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", message: "Introduce un email válido." };
  }

  const email = normalizeEmail(parsed.data.email);

  // Respuesta idéntica para emails no autorizados, para no revelar cuál es el válido.
  if (!isAllowedEmail(email, process.env.ALLOWED_EMAIL)) {
    return { status: "sent", email };
  }

  const origin = (await headers()).get("origin");
  if (!origin) {
    return { status: "error", message: "No se pudo determinar la URL de la app." };
  }

  const confirmUrl = new URL("/auth/confirm", origin);
  confirmUrl.searchParams.set("next", "/settings#password");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: confirmUrl.toString() },
  });

  if (error) {
    console.error("signInWithOtp", error);
    return { status: "error", message: sendErrorMessage(error) };
  }

  return { status: "sent", email };
}

/** Crea o cambia la contraseña del usuario con sesión iniciada. */
export async function setPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();

  const password = formData.get("password");
  const confirmation = formData.get("confirmation");
  if (typeof password !== "string" || typeof confirmation !== "string") {
    return { status: "error", message: "Rellena los dos campos." };
  }
  const invalid = checkNewPassword(password, confirmation);
  if (invalid) return { status: "error", message: invalid };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("updateUser password", error.code ?? error.status);
    return { status: "error", message: setPasswordErrorMessage(error) };
  }

  return { status: "saved" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
