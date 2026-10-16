import type { ReactNode } from 'react';

interface AdminDataTableProps {
  headers: string[];
  minWidth: string;
  children: ReactNode;
}

function AdminDataTable({ headers, minWidth, children }: AdminDataTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle">
      <table className="w-full border-collapse text-left" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-border-subtle bg-surface-muted">
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export default AdminDataTable;
