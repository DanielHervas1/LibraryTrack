import Link from "next/link";

import { signOut } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex items-center gap-5">
            <Link href="/" className="font-semibold">
              LibraryTrack
            </Link>
            <Link href="/add" className="text-sm text-muted hover:text-foreground">
              Añadir
            </Link>
          </nav>
          <form action={signOut} className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{user.email}</span>
            <button type="submit" className="text-sm text-muted hover:text-foreground">
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
