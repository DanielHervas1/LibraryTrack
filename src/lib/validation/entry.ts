import { z } from "zod";

import { STATUSES } from "@/lib/constants";

const emptyToNull = (value: string) => (value === "" ? null : value);

const optionalText = (max: number) => z.string().trim().max(max).transform(emptyToNull);

const optionalDate = z
  .union([z.literal(""), z.iso.date()])
  .transform((value) => (value === "" ? null : value));

const optionalScore = z
  .union([z.literal(""), z.coerce.number().int().min(1).max(10)])
  .transform((value) => (value === "" ? null : value));

/** Quita duplicados sin distinguir mayúsculas, conservando la primera forma escrita. */
export function dedupeGenres(genres: string[]): string[] {
  const seen = new Set<string>();
  return genres.filter((genre) => {
    const key = genre.toLocaleLowerCase("es");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const entryFormSchema = z
  .object({
    title: z.string().trim().min(1, "El título no puede estar vacío.").max(500),
    status: z.enum(STATUSES),
    score: optionalScore,
    review: optionalText(10_000),
    started_at: optionalDate,
    finished_at: optionalDate,
    genres: z.array(z.string().trim().min(1).max(60)).max(20).transform(dedupeGenres),
  })
  .refine((data) => !data.started_at || !data.finished_at || data.finished_at >= data.started_at, {
    message: "La fecha de fin no puede ser anterior a la de inicio.",
    path: ["finished_at"],
  });

export type EntryFormValues = z.infer<typeof entryFormSchema>;

export function parseEntryForm(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };

  return entryFormSchema.safeParse({
    title: text("title"),
    status: text("status"),
    score: text("score"),
    review: text("review"),
    started_at: text("started_at"),
    finished_at: text("finished_at"),
    genres: formData.getAll("genres").filter((value) => typeof value === "string"),
  });
}
