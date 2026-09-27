import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { isAllowedEmail } from "@/lib/auth/allowlist";
import { safeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/db/server";

/**
 * Destino del magic link. Acepta los dos formatos de Supabase:
 * - `?code=` (PKCE, plantilla de email por defecto; hay que abrirlo en el mismo navegador)
 * - `?token_hash=&type=` (plantilla personalizada; funciona desde cualquier dispositivo)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  let failed = true;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    failed = Boolean(error);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failed = Boolean(error);
  }

  if (failed) {
    return NextResponse.redirect(new URL("/login?error=link", request.url));
  }

  const { data } = await supabase.auth.getClaims();
  if (!isAllowedEmail(data?.claims?.email, process.env.ALLOWED_EMAIL)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
