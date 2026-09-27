import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/db/proxy";

// Rutas accesibles sin sesión.
const PUBLIC_PATHS = ["/login", "/auth", "/share", "/offline"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxy(request: NextRequest) {
  const { response, hasSession } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (!hasSession && !isPublicPath(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    if (pathname !== "/") loginUrl.searchParams.set("next", `${pathname}${search}`);

    const redirect = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Todo salvo estáticos, optimización de imágenes y archivos de public/.
    "/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|webmanifest)$).*)",
  ],
};
