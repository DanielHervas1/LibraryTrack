"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isAllowedEmail, normalizeEmail } from "@/lib/auth/allowlist";
import { normalizeOtpCode, sendErrorMessage, verifyErrorMessage } from "@/lib/auth/errors";
import { safeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/db/server";

export type LoginState =
  { status: "idle" } | { status: "sent"; email: string } | { status: "error"; message: string };

export type VerifyState = { status: "idle" } | { status: "error"; message: string };

const loginSchema = z.object({
  email: z.email(),
  next: z.string().optional(),
});

/**
 * Envía el correo de acceso. Incluye un código de 6 dígitos (se escribe en la app, así que
 * funciona en cualquier dispositivo y dentro de la PWA instalada) y un enlace.
 */
export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });
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
  confirmUrl.searchParams.set("next", safeNextPath(parsed.data.next));

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

const verifySchema = z.object({
  email: z.email(),
  code: z.string(),
  next: z.string().optional(),
});

/** Inicia sesión con el código del correo. */
export async function verifyEmailCode(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const parsed = verifySchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code") ?? "",
    next: formData.get("next") ?? undefined,
  });
  const token = parsed.success ? normalizeOtpCode(parsed.data.code) : null;
  if (!parsed.success || !token) {
    return { status: "error", message: "Escribe el código de 6 dígitos del correo." };
  }

  const email = normalizeEmail(parsed.data.email);
  if (!isAllowedEmail(email, process.env.ALLOWED_EMAIL)) {
    return { status: "error", message: verifyErrorMessage(null) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    console.error("verifyOtp", error);
    return { status: "error", message: verifyErrorMessage(error) };
  }

  redirect(safeNextPath(parsed.data.next));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
