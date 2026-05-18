import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'Tidak ada data',
  loading = false,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg border border-[var(--border-color)] p-8">
        <div className="flex items-center justify-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" aria-hidden="true"></div>
          <span className="sr-only">Memuat data...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg border border-[var(--border-color)] p-8">
        <p className="text-center text-[var(--text-secondary)] text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg border border-[var(--border-color)]">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-[var(--border-color)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)]">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              onKeyDown={(event) => {
                if (!onRowClick) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onRowClick(item);
                }
              }}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? 'button' : undefined}
              className={`${
                onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)]' : ''
              }`}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-sm text-[var(--text-primary)]">
                  {column.render ? column.render(item) : (item as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
