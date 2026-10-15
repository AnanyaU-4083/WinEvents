import type { ReactNode } from 'react'
import SearchBar from './SearchBar'

interface AdminSectionPanelProps {
  title: string
  description: string
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  addLabel: string
  onAdd: () => void
  children: ReactNode
}

function AdminSectionPanel({
  title,
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  addLabel,
  onAdd,
  children,
}: AdminSectionPanelProps) {
  return (
    <section className="rounded-xl border border-[#1e5b79]/35 bg-white p-6 shadow-lg shadow-slate-900/15">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">{title}</h2>
          <p className="mt-1 text-sm text-[#6b7280]">{description}</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
          <button
            type="button"
            className="rounded-lg bg-[#0066ff] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0052cc] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onAdd}
          >
            {addLabel}
          </button>
        </div>
      </div>
      {children}
    </section>
  )
}

export default AdminSectionPanel
