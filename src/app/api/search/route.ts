import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { MEDIA_TYPES } from "@/lib/constants";
import { findEntryIdsByExternalIds } from "@/lib/db/entries";
import { getSearchProvider } from "@/lib/providers";
import type { MediaSearchResult } from "@/lib/providers/types";

export type SearchResponse = {
  results: (MediaSearchResult & { entryId: string | null })[];
};

const querySchema = z.object({
  type: z.enum(MEDIA_TYPES),
  q: z.string().trim().min(2).max(200),
});

/**
 * Proxy a las APIs externas: las credenciales nunca llegan al cliente y el servidor
 * elige el proveedor según el tipo (TMDB, AniList, Google Books u Open Library).
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = querySchema.safeParse({
    type: request.nextUrl.searchParams.get("type"),
    q: request.nextUrl.searchParams.get("q") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros no válidos" }, { status: 400 });
  }

  const { type, q } = parsed.data;
  const provider = getSearchProvider(type);

  try {
    const results = await provider.search(q, type);
    const existing = await findEntryIdsByExternalIds(
      user.id,
      provider.id,
      results.map((result) => result.externalId),
    );
    const body: SearchResponse = {
      results: results.map((result) => ({
        ...result,
        entryId: existing.get(result.externalId) ?? null,
      })),
    };
    return NextResponse.json(body);
  } catch (error) {
    console.error("search", provider.id, error);
    return NextResponse.json({ error: "Error al buscar" }, { status: 502 });
  }
}
