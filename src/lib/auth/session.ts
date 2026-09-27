import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { isAllowedEmail } from "@/lib/auth/allowlist";
import { createClient } from "@/lib/db/server";

export type CurrentUser = {
  id: string;
  email: string;
};

/**
 * Usuario de la sesión actual, verificado contra el JWT y la allowlist.
 * Devuelve null si no hay sesión o si el email no es ALLOWED_EMAIL.
 * Memorizado por petición con `cache`.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub || !claims.email) return null;
  if (!isAllowedEmail(claims.email, process.env.ALLOWED_EMAIL)) return null;
  return { id: claims.sub, email: claims.email };
});

/**
 * Para páginas y Server Actions protegidas: devuelve el usuario o redirige a /login.
 * El proxy solo hace una comprobación optimista; esta es la comprobación real.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
