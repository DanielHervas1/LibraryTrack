// Gráficas sencillas de una sola serie, en HTML/CSS (sin librería).
// Especificación: barras <= 24px, extremo de datos redondeado 4px y base recta, un solo
// color (--chart), textos en tokens de texto (nunca en el color de la serie), valor en
// la punta de cada barra, tooltip al pasar o enfocar y tabla con los datos.

export type ChartDatum = {
  label: string;
  value: number;
  /** Texto extra para el tooltip y la tabla (p. ej. "nota media 7,5"). */
  detail?: string;
};

function DataTable({ data, valueLabel }: { data: ChartDatum[]; valueLabel: string }) {
  const hasDetail = data.some((d) => d.detail);
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-xs text-muted hover:text-foreground">
        Ver como tabla
      </summary>
      <table className="mt-2 w-full text-left">
        <thead className="text-xs text-muted">
          <tr>
            <th className="py-1 font-normal">Elemento</th>
            <th className="py-1 text-right font-normal">{valueLabel}</th>
            {hasDetail && <th className="py-1 text-right font-normal">Detalle</th>}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {data.map((d) => (
            <tr key={d.label} className="border-t border-border">
              <td className="py-1">{d.label}</td>
              <td className="py-1 text-right">{d.value.toLocaleString("es-ES")}</td>
              {hasDetail && <td className="py-1 text-right text-muted">{d.detail ?? ""}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Tooltip accesible: aparece al pasar el ratón o al enfocar con teclado/toque. */
function Tooltip({ datum, valueLabel }: { datum: ChartDatum; valueLabel: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {datum.label}: {datum.value.toLocaleString("es-ES")} {valueLabel.toLowerCase()}
      {datum.detail ? ` · ${datum.detail}` : ""}
    </span>
  );
}

/** Barras horizontales: comparar magnitudes entre categorías con nombre. */
export function BarList({
  data,
  valueLabel = "Entradas",
}: {
  data: ChartDatum[];
  valueLabel?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <ul className="flex flex-col gap-2.5">
        {data.map((datum) => (
          <li key={datum.label} className="grid grid-cols-[minmax(0,7rem)_1fr] items-center gap-3">
            <span className="truncate text-sm text-muted" title={datum.label}>
              {datum.label}
            </span>
            <div
              className="group relative flex items-center gap-2 outline-none"
              tabIndex={0}
              aria-label={`${datum.label}: ${datum.value} ${valueLabel.toLowerCase()}${datum.detail ? `, ${datum.detail}` : ""}`}
            >
              {datum.value > 0 && (
                <span
                  className="h-4 rounded-r-[4px] bg-chart"
                  style={{ width: `calc((100% - 3.5rem) * ${datum.value / max})` }}
                />
              )}
              <span className="text-sm font-medium tabular-nums">
                {datum.value.toLocaleString("es-ES")}
              </span>
              {datum.detail && (
                <span className="hidden text-xs text-muted sm:inline">{datum.detail}</span>
              )}
              <Tooltip datum={datum} valueLabel={valueLabel} />
            </div>
          </li>
        ))}
      </ul>
      <DataTable data={data} valueLabel={valueLabel} />
    </div>
  );
}

/** Columnas: una serie ordenada (meses, notas 1-10). Se etiqueta solo el máximo. */
export function ColumnChart({
  data,
  valueLabel = "Entradas",
  height = 140,
}: {
  data: ChartDatum[];
  valueLabel?: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value));
  const scale = Math.max(1, max);
  const maxIndex = data.findIndex((d) => d.value === max && max > 0);

  return (
    <div>
      <div className="flex items-end gap-1 border-b border-border" style={{ height }}>
        {data.map((datum, index) => (
          <div
            key={datum.label}
            className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none"
            tabIndex={0}
            aria-label={`${datum.label}: ${datum.value} ${valueLabel.toLowerCase()}`}
          >
            {index === maxIndex && (
              <span className="mb-1 text-xs font-medium tabular-nums">{datum.value}</span>
            )}
            {datum.value > 0 && (
              <span
                className="w-full max-w-6 rounded-t-[4px] bg-chart"
                style={{ height: `calc((100% - 1.25rem) * ${datum.value / scale})` }}
              />
            )}
            <Tooltip datum={datum} valueLabel={valueLabel} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {data.map((datum) => (
          <span key={datum.label} className="flex-1 truncate text-center text-[10px] text-muted">
            {datum.label}
          </span>
        ))}
      </div>
      <DataTable data={data} valueLabel={valueLabel} />
    </div>
  );
}

/** Cifra destacada: etiqueta, valor y una nota opcional. */
export function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-surface p-4">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
      {note && <span className="text-xs text-muted">{note}</span>}
    </div>
  );
}
