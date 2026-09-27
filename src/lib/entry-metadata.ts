import { z } from "zod";

import type { SeasonInfo } from "@/lib/providers/types";
import type { Json } from "@/types/database";

// entries.metadata es jsonb libre; aquí se define y valida lo que la app guarda en él.

const metadataSchema = z.object({
  provider_cover_url: z.string().nullable().optional().catch(undefined),
  seasons: z
    .array(z.object({ number: z.number().int().positive(), episodes: z.number().int().positive() }))
    .optional()
    .catch(undefined),
});

export type EntryMetadata = {
  provider_cover_url?: string | null;
  seasons?: SeasonInfo[];
};

/** Lee metadata de forma segura: lo que no encaje con el esquema se ignora. */
export function parseEntryMetadata(metadata: Json | null | undefined): EntryMetadata {
  const parsed = metadataSchema.safeParse(metadata ?? {});
  return parsed.success ? parsed.data : {};
}
