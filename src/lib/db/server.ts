import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Crear uno nuevo en cada petición; nunca compartirlo entre peticiones.
 */
export async function createClient() {
  // cookies() primero: marca la ruta como dinámica antes de leer el entorno,
  // así el build no intenta prerenderizar páginas que dependen de la sesión.
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Los Server Components no pueden escribir cookies. El proxy ya refresca
          // la sesión en cada petición, así que aquí se puede ignorar.
        }
      },
    },
  });
}
