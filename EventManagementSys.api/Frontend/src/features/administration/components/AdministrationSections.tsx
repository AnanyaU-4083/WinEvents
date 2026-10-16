import type { ChangeEvent, FormEvent } from 'react';
import AdminDataTable from './AdminDataTable';
import AdminSectionPanel from './AdminSectionPanel';
import EmptyTableRow from '@/shared/components/EmptyTableRow';
import FormField from '@/shared/components/FormField';

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
        <form
          onSubmit={onSubmit}
          className="mb-6 rounded-xl border border-border-default bg-surface-muted p-5"
        >
          <h3 className="mb-5 text-base font-semibold text-text-primary">
            {editingId === null ? 'Add Organization' : 'Edit Organization'}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Name">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                required
                className={inputClass}
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
                className={inputClass}
              />
            </FormField>
            <FormField label="Phone">
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
            onCancel={onCancel}
            addLabel="Add Organization"
            updateLabel="Update Organization"
          />
        </form>
      )}

      <AdminDataTable
        minWidth="760px"
        headers={['Organization', 'Email', 'Phone', 'Contact Person', 'Actions']}
      >
        {items.length === 0 ? (
          <EmptyTableRow
            colSpan={5}
            title={searchValue ? 'No matching organizations' : 'No organizations found'}
            description={
              searchValue ? 'Try a different search.' : 'Organizations will appear here.'
            }
          />
        ) : (
          items.map((item) => (
            <tr key={item.orgId} className={rowClass}>
              <td className={cellClass}>{item.name}</td>
              <td className={cellClass}>{item.email}</td>
              <td className={cellClass}>{item.phone}</td>
              <td className={cellClass}>{item.contactPerson || '-'}</td>
              <td className="px-4 py-3">
                <RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.orgId)} />
              </td>
            </tr>
          ))
        )}
      </AdminDataTable>
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
        <form
          onSubmit={onSubmit}
          className="mb-6 rounded-xl border border-border-default bg-surface-muted p-5"
        >
          <h3 className="mb-5 text-base font-semibold text-text-primary">
            {editingId === null ? 'Add Employee' : 'Edit Employee'}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Name">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                required
                className={inputClass}
              />
            </FormField>
            <FormField label="Job Title">
              <input
                type="text"
                name="jobTitle"
                value={form.jobTitle}
                onChange={onChange}
                required
                className={inputClass}
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
                className={inputClass}
              />
            </FormField>
            <FormField label="Organization">
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
            onCancel={onCancel}
            addLabel="Add Employee"
            updateLabel="Update Employee"
          />
        </form>
      )}

      <AdminDataTable
        minWidth="760px"
        headers={['Name', 'Email', 'Job Title', 'Organization', 'Actions']}
      >
        {items.length === 0 ? (
          <EmptyTableRow
            colSpan={5}
            title={searchValue ? 'No matching employees' : 'No employees found'}
            description={searchValue ? 'Try a different search.' : 'Employees will appear here.'}
          />
        ) : (
          items.map((item) => (
            <tr key={item.employeeId} className={rowClass}>
              <td className={cellClass}>{item.name}</td>
              <td className={cellClass}>{item.email}</td>
              <td className={cellClass}>{item.jobTitle}</td>
              <td className={cellClass}>{organizationName(item.orgId)}</td>
              <td className="px-4 py-3">
                <RowActions
                  onEdit={() => onEdit(item)}
                  onDelete={() => onDelete(item.employeeId)}
                />
              </td>
            </tr>
          ))
        )}
      </AdminDataTable>
    </AdminSectionPanel>
  );
}

interface VenueSectionProps {
  items: Venue[];
  searchValue: string;
  form: VenueFormData;
  formOpen: boolean;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onOpenAdd: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
}

export function VenueSection({
  items,
  searchValue,
  form,
  formOpen,
  loading,
  onSearchChange,
  onOpenAdd,
  onSubmit,
  onChange,
  onCancel,
}: VenueSectionProps) {
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
        <form
          onSubmit={onSubmit}
          className="mb-6 rounded-xl border border-border-default bg-surface-muted p-5"
        >
          <h3 className="mb-5 text-base font-semibold text-text-primary">Add Venue</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Address">
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={onChange}
                required
                className={inputClass}
              />
            </FormField>
            <FormField label="Capacity">
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
            editing={false}
            onCancel={onCancel}
            addLabel="Add Venue"
            updateLabel="Add Venue"
          />
        </form>
      )}

      <AdminDataTable minWidth="600px" headers={['Venue', 'Location', 'Capacity']}>
        {items.length === 0 ? (
          <EmptyTableRow
            colSpan={3}
            title={searchValue ? 'No matching venues' : 'No venues found'}
            description={searchValue ? 'Try a different search.' : 'Venues will appear here.'}
          />
        ) : (
          items.map((item) => (
            <tr key={item.venueId} className={rowClass}>
              <td className={cellClass}>{item.address}</td>
              <td className={cellClass}>{item.address}</td>
              <td className={cellClass}>{item.capacity}</td>
            </tr>
          ))
        )}
      </AdminDataTable>
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
  onCancel: () => void;
  addLabel: string;
  updateLabel: string;
}

function FormActions({ loading, editing, onCancel, addLabel, updateLabel }: FormActionsProps) {
  return (
    <div className="mt-5 flex flex-wrap justify-end gap-3">
      <button
        type="button"
        className="rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:border-brand-primary hover:bg-surface-blue hover:text-brand-primary-hover"
        onClick={onCancel}
      >
        Cancel
      </button>
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
}

function RowActions({ onEdit, onDelete }: RowActionsProps) {
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
        className="rounded-lg border border-surface-error bg-white px-4 py-2.5 text-sm font-medium text-state-error transition hover:bg-surface-error"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  );
}
