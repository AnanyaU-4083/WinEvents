// Render the selected administration section.
import type { ReactNode } from 'react';
import SearchBar from '@/shared/components/SearchBar';

interface AdminSectionPanelProps {
  title: string;
  description: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  addLabel: string;
  onAdd: () => void;
  children: ReactNode;
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
    <section className="glass-panel p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
          <button
            type="button"
            className="whitespace-nowrap rounded-lg bg-brand-primary px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onAdd}
          >
            {addLabel}
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}

export default AdminSectionPanel;
