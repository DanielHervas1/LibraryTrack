import type { Metadata } from "next";
import Link from "next/link";

import { EntryDetail, loadEntry } from "@/components/entries/entry-detail";

export async function generateMetadata(props: PageProps<"/entry/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const { entry } = await loadEntry(id);
  return { title: entry.title };
}

/** Ficha a página completa (enlace directo o recarga). Desde el catálogo se abre como modal. */
export default async function EntryPage(props: PageProps<"/entry/[id]">) {
  const { id } = await props.params;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← Catálogo
      </Link>
      <EntryDetail id={id} />
    </div>
  );
}
