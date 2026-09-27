import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Entrar",
};

const ERROR_MESSAGES: Record<string, string> = {
  link: "El enlace no es válido o ha caducado. Pide uno nuevo.",
  unauthorized: "Esta cuenta no tiene acceso a la app.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? safeNextPath(searchParams.next) : undefined;
  const error = typeof searchParams.error === "string" ? ERROR_MESSAGES[searchParams.error] : null;

  if (await getCurrentUser()) redirect(next ?? "/");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">LibraryTrack</h1>
        <p className="mt-1 text-sm text-muted">Entra con un enlace mágico en tu email.</p>
      </div>
      {error && (
        <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <LoginForm next={next} />
    </main>
  );
}
