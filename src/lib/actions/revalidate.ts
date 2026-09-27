import "server-only";

import { revalidatePath } from "next/cache";

/** Páginas que muestran entradas y deben refrescarse tras un cambio. */
export function revalidateEntryPages(entryId?: string) {
  revalidatePath("/");
  revalidatePath("/list");
  revalidatePath("/favorites");
  if (entryId) revalidatePath(`/entry/${entryId}`);
}
