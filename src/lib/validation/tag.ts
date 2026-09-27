import { z } from "zod";

export const TAG_MAX_LENGTH = 40;

/** Nombre de tag: sin espacios sobrantes, 1-40 caracteres. */
export const tagNameSchema = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(1, "El tag no puede estar vacío.")
      .max(TAG_MAX_LENGTH, `Máximo ${TAG_MAX_LENGTH} caracteres.`),
  );
