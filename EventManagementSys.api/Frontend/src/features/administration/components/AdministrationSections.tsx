// Coordinate administration data and dialogs.
import type { ChangeEvent, FormEvent } from 'react';
import AdminSectionPanel from './AdminSectionPanel';
import FormField from '@/shared/components/FormField';
import Modal from '@/shared/components/Modal';

export interface Organization {
  orgId: number;
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
}

export interface Employee {
  employeeId: number;
  name: string;
  jobTitle: string;
  email: string;
  orgId: number;
}

export interface Venue {
  venueId: number;
  address: string;
  capacity: number;
}

export interface OrganizationFormData {
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
}

export interface EmployeeFormData {
  name: string;
  jobTitle: string;
  email: string;
  orgId: string;
}

export interface VenueFormData {
  address: string;
  capacity: string;
}

interface OrganizationSectionProps {
  items: Organization[];
  searchValue: string;
  form: OrganizationFormData;
  formOpen: boolean;
  editingId: number | null;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onOpenAdd: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onEdit: (item: Organization) => void;
  onDelete: (id: number) => void;
}

export function OrganizationSection({
  items,
  searchValue,
  form,
  formOpen,
  editingId,
  loading,
  onSearchChange,
  onOpenAdd,
  onSubmit,
  onChange,
  onCancel,
  onEdit,
  onDelete,
}: OrganizationSectionProps) {
  return (
    <AdminSectionPanel
      title="Organizations"
      description="Create and manage event organizations."
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search organizations..."
      addLabel="+ Add Organization"
      onAdd={onOpenAdd}
    >
      {formOpen && (
        <Modal
          open={formOpen}
          ariaLabel={editingId === null ? 'Add organization' : 'Edit organization'}
          onClose={onCancel}
          className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border-accent/40 bg-white shadow-2xl"
        >
          <form onSubmit={onSubmit}>
            <h3 className="mb-5 text-base font-semibold text-text-primary">
              {editingId === null ? 'Add Organization' : 'Edit Organization'}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Name" required>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  className={inputClass}
                />
              </FormField>
              <FormField label="Email" required>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  className={inputClass}
                />
              </FormField>
              <FormField label="Phone" required>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  required
                  className={inputClass}
                />
              </FormField>
              <FormField label="Contact Person">
                <input
                  type="text"
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={onChange}
                  className={inputClass}
                />
              </FormField>
            </div>
            <FormActions
              loading={loading}
              editing={editingId !== null}
              addLabel="Add Organization"
              updateLabel="Update Organization"
            />
          </form>
        </Modal>
      )}

      <div className="space-y-3" aria-label="Organizations">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blue-200 bg-white/55 px-5 py-10 text-center">
            <h3 className="text-base font-semibold text-text-primary">
              {searchValue ? 'No matching organizations' : 'No organizations found'}
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              {searchValue ? 'Try a different search.' : 'Organizations will appear here.'}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.orgId}
              className="flex min-w-0 flex-col gap-4 rounded-xl border border-border-subtle bg-white/75 p-4 shadow-sm transition hover:border-brand-primary/35 hover:bg-white/90 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-text-primary">{item.name}</h3>
                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Email
                    </dt>
                    <dd className="mt-0.5 truncate text-text-secondary">{item.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Phone
                    </dt>
                    <dd className="mt-0.5 text-text-secondary">{item.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Contact person
                    </dt>
                    <dd className="mt-0.5 text-text-secondary">{item.contactPerson || '-'}</dd>
                  </div>
                </dl>
              </div>
              <RowActions
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item.orgId)}
                deleteLabel={'Delete ' + item.name}
              />
            </article>
          ))
        )}
      </div>
    </AdminSectionPanel>
  );
}

interface EmployeeSectionProps {
  items: Employee[];
  organizations: Organization[];
  searchValue: string;
  form: EmployeeFormData;
  formOpen: boolean;
  editingId: number | null;
  loading: boolean;
  organizationName: (id: number) => string;
  onSearchChange: (value: string) => void;
  onOpenAdd: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>) => void;
  onCancel: () => void;
  onEdit: (item: Employee) => void;
  onDelete: (id: number) => void;
}

export function EmployeeSection({
  items,
  organizations,
  searchValue,
  form,
  formOpen,
  editingId,
  loading,
  organizationName,
  onSearchChange,
  onOpenAdd,
  onSubmit,
  onChange,
  onCancel,
  onEdit,
  onDelete,
}: EmployeeSectionProps) {
  return (
    <AdminSectionPanel
      title="Employees"
      description="Create and manage employees."
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search employees..."
      addLabel="+ Add Employee"
      onAdd={onOpenAdd}
    >
      {formOpen && (
        <Modal
          open={formOpen}
          ariaLabel={editingId === null ? 'Add employee' : 'Edit employee'}
          onClose={onCancel}
          className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border-accent/40 bg-white shadow-2xl"
        >
          <form onSubmit={onSubmit}>
            <h3 className="mb-5 text-base font-semibold text-text-primary">
              {editingId === null ? 'Add Employee' : 'Edit Employee'}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Name" required>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  className={inputClass}
                />
              </FormField>
              <FormField label="Job Title" required>
                <input
                  type="text"
                  name="jobTitle"
                  value={form.jobTitle}
                  onChange={onChange}
                  required
                  className={inputClass}
                />
              </FormField>
              <FormField label="Email" required>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  className={inputClass}
                />
              </FormField>
              <FormField label="Organization" required>
                <select
                  name="orgId"
                  value={form.orgId}
                  onChange={onChange}
                  required
                  className={inputClass}
                >
                  <option value="">Select organization</option>
                  {organizations.map((organization) => (
                    <option key={organization.orgId} value={organization.orgId}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormActions
              loading={loading}
              editing={editingId !== null}
              addLabel="Add Employee"
              updateLabel="Update Employee"
            />
          </form>
        </Modal>
      )}

      <div className="space-y-3" aria-label="Employees">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blue-200 bg-white/55 px-5 py-10 text-center">
            <h3 className="text-base font-semibold text-text-primary">
              {searchValue ? 'No matching employees' : 'No employees found'}
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              {searchValue ? 'Try a different search.' : 'Employees will appear here.'}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.employeeId}
              className="flex min-w-0 flex-col gap-4 rounded-xl border border-border-subtle bg-white/75 p-4 shadow-sm transition hover:border-brand-primary/35 hover:bg-white/90 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-text-primary">{item.name}</h3>
                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Email
                    </dt>
                    <dd className="mt-0.5 truncate text-text-secondary">{item.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Job title / role
                    </dt>
                    <dd className="mt-0.5 text-text-secondary">{item.jobTitle}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Organization
                    </dt>
                    <dd className="mt-0.5 text-text-secondary">{organizationName(item.orgId)}</dd>
                  </div>
                </dl>
              </div>
              <RowActions
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item.employeeId)}
                deleteLabel={'Delete ' + item.name}
              />
            </article>
          ))
        )}
      </div>
    </AdminSectionPanel>
  );
}

interface VenueSectionProps {
  items: Venue[];
  searchValue: string;
  form: VenueFormData;
  formOpen: boolean;
  editingId: number | null;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onOpenAdd: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onEdit: (item: Venue) => void;
  onDelete: (id: number) => void;
}

export function VenueSection({
  items,
  searchValue,
  form,
  formOpen,
  editingId,
  loading,
  onSearchChange,
  onOpenAdd,
  onSubmit,
  onChange,
  onCancel,
  onEdit,
  onDelete,
}: VenueSectionProps) {
  const isEditing = editingId !== null;

  return (
    <AdminSectionPanel
      title="Venues"
      description="View and manage event venues."
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search venues..."
      addLabel="+ Add Venue"
      onAdd={onOpenAdd}
    >
      {formOpen && (
        <Modal
          open={formOpen}
          ariaLabel={isEditing ? 'Edit venue' : 'Add venue'}
          onClose={onCancel}
          className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border-accent/40 bg-white shadow-2xl"
        >
          <form onSubmit={onSubmit}>
            <h3 className="mb-5 text-base font-semibold text-text-primary">
              {isEditing ? 'Edit Venue' : 'Add Venue'}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Address" required>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={onChange}
                  required
                  className={inputClass}
                />
              </FormField>
              <FormField label="Capacity" required>
                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={onChange}
                  min="1"
                  required
                  className={inputClass}
                />
              </FormField>
            </div>
            <FormActions
              loading={loading}
              editing={isEditing}
              addLabel="Add Venue"
              updateLabel="Update Venue"
            />
          </form>
        </Modal>
      )}

      <div className="space-y-3" aria-label="Venues">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blue-200 bg-white/55 px-5 py-10 text-center">
            <h3 className="text-base font-semibold text-text-primary">
              {searchValue ? 'No matching venues' : 'No venues found'}
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              {searchValue ? 'Try a different search.' : 'Venues will appear here.'}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.venueId}
              className="flex min-w-0 flex-col gap-4 rounded-xl border border-border-subtle bg-white/75 p-4 shadow-sm transition hover:border-brand-primary/35 hover:bg-white/90 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-text-primary">
                  {item.address}
                </h3>
                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Location
                    </dt>
                    <dd className="mt-0.5 truncate text-text-secondary">{item.address}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Capacity
                    </dt>
                    <dd className="mt-0.5 text-text-secondary">{item.capacity}</dd>
                  </div>
                </dl>
              </div>
              <RowActions
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item.venueId)}
                deleteLabel={'Delete venue at ' + item.address}
              />
            </article>
          ))
        )}
      </div>
    </AdminSectionPanel>
  );
}
const inputClass =
  'w-full rounded-lg border border-border-default bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-placeholder focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20';
const rowClass = 'border-b border-border-subtle last:border-b-0 hover:bg-surface-muted';
const cellClass = 'px-4 py-3 text-sm text-text-secondary';

interface FormActionsProps {
  loading: boolean;
  editing: boolean;
  addLabel: string;
  updateLabel: string;
}

function FormActions({ loading, editing, addLabel, updateLabel }: FormActionsProps) {
  return (
    <div className="mt-5 flex flex-wrap justify-end gap-3">
      <button
        type="submit"
        className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Saving...' : editing ? updateLabel : addLabel}
      </button>
    </div>
  );
}

interface RowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  deleteLabel: string;
}

function RowActions({ onEdit, onDelete, deleteLabel }: RowActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:border-brand-primary hover:bg-surface-blue hover:text-brand-primary-hover"
        onClick={onEdit}
      >
        Edit
      </button>
      <button
        type="button"
        aria-label={deleteLabel}
        title="Delete"
        className="grid h-8 w-8 place-items-center rounded-lg border border-surface-error bg-white p-0 text-state-error transition hover:bg-surface-error"
        onClick={onDelete}
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18M8 6V4h8v2m2 0-1 14H7L6 6m4 4v6m4-6v6" />
        </svg>
      </button>
    </div>
  );
}
