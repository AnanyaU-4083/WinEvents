import type { ReactNode } from 'react'

interface AdminDataTableProps {
  headers: string[]
  minWidth: string
  children: ReactNode
}

function AdminDataTable({ headers, minWidth, children }: AdminDataTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#edf0f4]">
      <table
        className="w-full border-collapse text-left"
        style={{ minWidth }}
      >
        <thead>
          <tr className="border-b border-[#edf0f4] bg-[#f8fafc]">
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export default AdminDataTable
