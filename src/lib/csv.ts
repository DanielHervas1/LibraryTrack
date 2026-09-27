// Serialización CSV (RFC 4180) pensada para abrirse en Excel / Google Sheets.

export type CsvValue = string | number | boolean | null | undefined;

/**
 * Escapa una celda. Además neutraliza la "inyección de fórmulas": un texto que empieza
 * por = + - @ (o tab/CR) se ejecutaría como fórmula en una hoja de cálculo.
 */
export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV con cabecera. Incluye BOM para que Excel detecte UTF-8 (acentos). */
export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}
