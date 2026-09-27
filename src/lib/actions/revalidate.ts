import "server-only";

import { revalidatePath } from "next/cache";

/** Páginas que muestran entradas y deben refrescarse tras un cambio. */
export function revalidateEntryPages(entryId?: string) {
  revalidatePath("/");
  revalidatePath("/list");
  revalidatePath("/favorites");
  revalidatePath("/diary");
  revalidatePath("/stats");
  if (entryId) revalidatePath(`/entry/${entryId}`);
}
