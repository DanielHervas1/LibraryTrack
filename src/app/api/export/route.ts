import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { todayISO } from "@/lib/constants";
import { getExportEntries } from "@/lib/db/entries";
import { buildExportJson, entriesToCsv, exportFilename } from "@/lib/export";

/** Descarga de todos los datos: /api/export?format=json|csv */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const format = request.nextUrl.searchParams.get("format");
  if (format !== "json" && format !== "csv") {
    return NextResponse.json({ error: "Formato no válido (json o csv)" }, { status: 400 });
  }

  const entries = await getExportEntries(user.id);
  const filename = exportFilename(format, todayISO());
  const headers = {
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, no-store",
  };

  if (format === "csv") {
    return new NextResponse(entriesToCsv(entries), {
      headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" },
    });
  }

  return new NextResponse(JSON.stringify(buildExportJson(entries, new Date()), null, 2), {
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });
}
