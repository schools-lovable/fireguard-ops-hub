/** FireGuard report serialization keeps CSV export deterministic and independently testable. */
const escapeCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function buildCsv(header: string[], rows: unknown[][]) {
  return [header, ...rows].map(row => row.map(escapeCell).join(",")).join("\n");
}
