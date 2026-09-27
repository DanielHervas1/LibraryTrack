import Link from "next/link";

export default function EntryNotFound() {
  return (
    <section className="flex flex-col items-center gap-3 py-20 text-center">
      <h1 className="text-lg font-semibold">Esta entrada no existe</h1>
      <p className="text-sm text-muted">Puede que la hayas borrado.</p>
      <Link href="/" className="text-sm text-accent hover:underline">
        Volver al catálogo
      </Link>
    </section>
  );
}
