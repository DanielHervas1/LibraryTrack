import type { Metadata } from "next";
import Link from "next/link";

import { ManualEntryForm } from "@/components/entries/manual-entry-form";
import { requireUser } from "@/lib/auth/session";
import { parseMediaType } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Añadir a mano",
};

export default async function ManualEntryPage(props: PageProps<"/add/manual">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;
  const type = parseMediaType(searchParams.type) ?? "movie";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Link href={`/add?type=${type}`} className="text-sm text-muted hover:text-foreground">
        ← Volver a buscar
      </Link>
      <div>
        <h1 className="text-xl font-semibold">Añadir a mano</h1>
        <p className="mt-1 text-sm text-muted">
          Para lo que no aparece en ninguna API. Todo se puede editar después.
        </p>
      </div>
      <ManualEntryForm userId={user.id} initialType={type} />
    </div>
  );
}
