import type { ReactNode } from "react";

/**
 * Minimal data table for the admin dashboard.
 * Columns own their cell rendering; empty state is a friendly message.
 */
export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends { id?: string }>({
  rows,
  columns,
  emptyLabel = "Nothing here yet.",
  keyField = (r: T, i: number) => (r.id ?? String(i)),
}: {
  rows: T[];
  columns: Column<T>[];
  emptyLabel?: string;
  keyField?: (row: T, index: number) => string | number;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-brand-black/10 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-brand-black/5 text-left">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-3 font-semibold ${c.className ?? ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="muted px-4 py-10 text-center">
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={keyField(r, i)} className="border-t border-brand-black/5">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
