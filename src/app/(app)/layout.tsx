import Link from "next/link";

import { DesktopNav, MobileNav } from "@/components/layout/nav-links";
import { requireUser } from "@/lib/auth/session";

/** Layout de la app autenticada. `modal` es el slot @modal (ficha sobre el catálogo). */
export default async function AppLayout({ children, modal }: LayoutProps<"/">) {
  await requireUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático pequeño */}
            <img src="/icon.svg" alt="" className="size-6" />
            LibraryTrack
          </Link>
          <DesktopNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 sm:pb-10">{children}</main>
      <MobileNav />
      {modal}
    </div>
  );
}
