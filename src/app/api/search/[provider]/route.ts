import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { MEDIA_TYPES, PROVIDERS } from "@/lib/constants";
import { findEntryIdsByExternalIds } from "@/lib/db/entries";
import { getProvider } from "@/lib/providers";
import type { MediaSearchResult } from "@/lib/providers/types";

export type SearchResponse = {
  results: (MediaSearchResult & { entryId: string | null })[];
};

const querySchema = z.object({
  provider: z.enum(PROVIDERS).exclude(["manual"]),
  type: z.enum(MEDIA_TYPES),
  q: z.string().trim().min(2).max(200),
});

/** Proxy a las APIs externas: las credenciales nunca llegan al cliente. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/search/[provider]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { provider: providerParam } = await ctx.params;
  const parsed = querySchema.safeParse({
    provider: providerParam,
    type: request.nextUrl.searchParams.get("type"),
    q: request.nextUrl.searchParams.get("q") ?? "",
  });
  if (!parsed.success)
    return NextResponse.json({ error: "Parámetros no válidos" }, { status: 400 });

  const { provider: providerId, type, q } = parsed.data;
  const provider = getProvider(providerId, type);
  if (!provider) return NextResponse.json({ error: "Tipo no soportado" }, { status: 400 });

  try {
    const results = await provider.search(q, type);
    const existing = await findEntryIdsByExternalIds(
      user.id,
      providerId,
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
    console.error("search", providerId, error);
    return NextResponse.json({ error: "Error al buscar" }, { status: 502 });
  }
}
