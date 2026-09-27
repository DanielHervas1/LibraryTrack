import type { Metadata } from "next";
import Link from "next/link";

import { BarList, ColumnChart, StatTile, type ChartDatum } from "@/components/stats/charts";
import { requireUser } from "@/lib/auth/session";
import {
  MEDIA_TYPES,
  MEDIA_TYPE_PLURAL_LABELS,
  STATUSES,
  statusLabel,
  todayISO,
} from "@/lib/constants";
import { getProfile } from "@/lib/db/profile";
import { getStatsEntries } from "@/lib/db/stats";
import { computeStats, formatHours, yearsWithActivity, type CountItem } from "@/lib/stats";
import { chipClass } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Estadísticas",
};

const monthFormat = new Intl.DateTimeFormat("es-ES", { month: "short", timeZone: "UTC" });

function monthLabel(month: string) {
  return monthFormat.format(new Date(`${month}-15T12:00:00Z`)).replace(".", "");
}

function formatScore(score: number | null) {
  return score === null ? "—" : score.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

function toDatum(item: CountItem): ChartDatum {
  return {
    label: item.name,
    value: item.count,
    detail: item.averageScore === null ? undefined : `nota media ${formatScore(item.averageScore)}`,
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <h2 className="font-medium">{title}</h2>
      {children}
    </section>
  );
}

export default async function StatsPage(props: PageProps<"/stats">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;
  const [entries, profile] = await Promise.all([getStatsEntries(user.id), getProfile(user.id)]);

  const years = yearsWithActivity(entries);
  const requestedYear = Number(searchParams.year);
  const year = years.includes(requestedYear) ? requestedYear : undefined;
  const today = todayISO();
  const stats = computeStats(entries, { minutesPerPage: profile.minutesPerPage, year, today });

  if (entries.length === 0) {
    return (
      <section className="flex flex-col items-center gap-3 py-20 text-center">
        <h1 className="text-lg font-semibold">Aún no hay estadísticas</h1>
        <p className="text-sm text-muted">Añade y puntúa algunas entradas y aparecerán aquí.</p>
        <Link
          href="/add"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Añadir
        </Link>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold">{year ? `Mi ${year}` : "Estadísticas"}</h1>
        {years.length > 0 && (
          <nav
            aria-label="Elegir año"
            className="-mx-4 no-scrollbar flex gap-2 overflow-x-auto px-4"
          >
            <Link
              href="/stats"
              aria-current={!year ? "page" : undefined}
              className={chipClass(!year)}
            >
              Todo
            </Link>
            {years.map((y) => (
              <Link
                key={y}
                href={`/stats?year=${y}`}
                aria-current={year === y ? "page" : undefined}
                className={chipClass(year === y)}
              >
                {y}
              </Link>
            ))}
          </nav>
        )}
        {year && <p className="text-sm text-muted">Solo cuenta lo que terminaste en {year}.</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label={year ? "Terminadas" : "Entradas"}
          value={stats.total.toLocaleString("es-ES")}
        />
        <StatTile label="Tiempo total" value={formatHours(stats.totalMinutes)} />
        <StatTile label="Nota media" value={formatScore(stats.averageScore)} />
        <StatTile label="Completadas" value={stats.byStatus.completed.toLocaleString("es-ES")} />
      </div>

      <Section title="Tiempo por tipo">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {MEDIA_TYPES.map((type) => (
            <StatTile
              key={type}
              label={MEDIA_TYPE_PLURAL_LABELS[type]}
              value={formatHours(stats.minutesByType[type])}
              note={
                type === "book"
                  ? `Estimado: ${profile.minutesPerPage.toLocaleString("es-ES")} min/página`
                  : `Nota media ${formatScore(stats.averageScoreByType[type])}`
              }
            />
          ))}
        </div>
        {stats.missingDuration > 0 && (
          <p className="text-xs text-muted">
            {stats.missingDuration}{" "}
            {stats.missingDuration === 1 ? "entrada no suma" : "entradas no suman"} tiempo porque no
            tienen duración. Puedes añadirla en su ficha.
          </p>
        )}
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Por tipo">
          <BarList
            data={MEDIA_TYPES.map((type) => ({
              label: MEDIA_TYPE_PLURAL_LABELS[type],
              value: stats.byType[type],
            }))}
          />
        </Section>
        <Section title="Por estado">
          <BarList
            data={STATUSES.map((status) => ({
              label: statusLabel(status),
              value: stats.byStatus[status],
            }))}
          />
        </Section>
      </div>

      <Section
        title={year ? `Terminadas por mes en ${year}` : "Terminadas en los últimos 12 meses"}
      >
        <ColumnChart
          valueLabel="Terminadas"
          data={stats.completedByMonth.map((m) => ({ label: monthLabel(m.month), value: m.count }))}
        />
      </Section>

      <Section title="Distribución de notas">
        <ColumnChart
          data={stats.scoreDistribution.map((count, index) => ({
            label: String(index + 1),
            value: count,
          }))}
        />
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Géneros más frecuentes">
          {stats.topGenres.length > 0 ? (
            <BarList data={stats.topGenres.map(toDatum)} />
          ) : (
            <p className="text-sm text-muted">Sin géneros todavía.</p>
          )}
        </Section>
        <Section title="Tags más usados">
          {stats.topTags.length > 0 ? (
            <BarList data={stats.topTags.map(toDatum)} />
          ) : (
            <p className="text-sm text-muted">Aún no has puesto tags.</p>
          )}
        </Section>
      </div>
    </div>
  );
}
