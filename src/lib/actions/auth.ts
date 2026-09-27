"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isAllowedEmail, normalizeEmail } from "@/lib/auth/allowlist";
import { safeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/db/server";

export type LoginState =
  { status: "idle" } | { status: "sent"; email: string } | { status: "error"; message: string };

const loginSchema = z.object({
  email: z.email(),
  next: z.string().optional(),
});

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
    return { status: "error", message: "No se pudo enviar el enlace. Inténtalo de nuevo." };
  }

  return { status: "sent", email };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
