import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminDataTable from '../src/features/administration/components/AdminDataTable';
import AdminSectionPanel from '../src/features/administration/components/AdminSectionPanel';
import {
  EmployeeSection,
  OrganizationSection,
  VenueSection,
} from '../src/features/administration/components/AdministrationSections';

describe('administration layout components', () => {
  it('renders table headers and content with the requested minimum width', () => {
    render(
      <AdminDataTable minWidth="600px" headers={['Name', 'Actions']}>
        <tr>
          <td>Alex</td>
          <td>Edit</td>
        </tr>
      </AdminDataTable>,
    );
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveStyle({ minWidth: '600px' });
  });

  it('shows description, search, add button, and forwards both actions', () => {
    const onSearchChange = vi.fn();
    const onAdd = vi.fn();
    render(
      <AdminSectionPanel
        title="Organizations"
        description="Manage organizations"
        searchValue=""
        onSearchChange={onSearchChange}
        searchPlaceholder="Search organizations"
        addLabel="Add organization"
        onAdd={onAdd}
      >
        <p>Organization content</p>
      </AdminSectionPanel>,
    );
    fireEvent.change(screen.getByPlaceholderText('Search organizations'), {
      target: { value: 'Win' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add organization' }));
    expect(onSearchChange).toHaveBeenCalledWith('Win');
    expect(onAdd).toHaveBeenCalledOnce();
    expect(screen.getByText('Organization content')).toBeInTheDocument();
  });
});

const organization = {
  orgId: 1,
  name: 'WinWire',
  email: 'info@example.com',
  phone: '123',
  contactPerson: 'Alex',
};
const employee = {
  employeeId: 2,
  name: 'Jordan',
  jobTitle: 'Coordinator',
  email: 'jordan@example.com',
  orgId: 1,
};
const venue = { venueId: 3, address: 'Main Hall', capacity: 250 };

describe('organization section', () => {
  it('renders empty guidance and the add control', () => {
    const onOpenAdd = vi.fn();
    render(
      <OrganizationSection
        items={[]}
        searchValue=""
        form={{ name: '', email: '', phone: '', contactPerson: '' }}
        formOpen={false}
        editingId={null}
        loading={false}
        onSearchChange={vi.fn()}
        onOpenAdd={onOpenAdd}
        onSubmit={vi.fn()}
        onChange={vi.fn()}
        onCancel={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('No organizations found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '+ Add Organization' }));
    expect(onOpenAdd).toHaveBeenCalledOnce();
  });

  it('renders an edit form and organization actions', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn((event) => event.preventDefault());
    const onCancel = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <OrganizationSection
        items={[organization]}
        searchValue="Win"
        form={{ name: 'WinWire', email: 'info@example.com', phone: '123', contactPerson: 'Alex' }}
        formOpen
        editingId={1}
        loading={false}
        onSearchChange={vi.fn()}
        onOpenAdd={vi.fn()}
        onSubmit={onSubmit}
        onChange={onChange}
        onCancel={onCancel}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Edit Organization' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'WinWire Inc.' } });
    expect(onChange).toHaveBeenCalledOnce();
    fireEvent.submit(screen.getByRole('heading', { name: 'Edit Organization' }).closest('form')!);
    expect(onSubmit).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith(organization);
    expect(onDelete).toHaveBeenCalledWith(1);
    expect(screen.getByText('WinWire')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('shows search-specific empty state and add-form labels', () => {
    render(
      <OrganizationSection
        items={[]}
        searchValue="missing"
        form={{ name: '', email: '', phone: '', contactPerson: '' }}
        formOpen
        editingId={null}
        loading
        onSearchChange={vi.fn()}
        onOpenAdd={vi.fn()}
        onSubmit={vi.fn()}
        onChange={vi.fn()}
        onCancel={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('No matching organizations')).toBeInTheDocument();
    expect(screen.getByText('Add Organization')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });
});

describe('employee section', () => {
  it('renders an employee form, organization options, row, and callbacks', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onChange = vi.fn();
    render(
      <EmployeeSection
        items={[employee]}
        organizations={[organization]}
        searchValue=""
        form={{ name: 'Jordan', jobTitle: 'Coordinator', email: 'jordan@example.com', orgId: '1' }}
        formOpen
        editingId={null}
        loading={false}
        organizationName={() => 'WinWire'}
        onSearchChange={vi.fn()}
        onOpenAdd={vi.fn()}
        onSubmit={vi.fn((event) => event.preventDefault())}
        onChange={onChange}
        onCancel={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Add Employee' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'WinWire' })).toHaveValue('1');
    fireEvent.change(screen.getByLabelText('Organization'), { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledOnce();
    expect(screen.getByText('Coordinator')).toBeInTheDocument();
    expect(screen.getAllByText('WinWire')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onEdit).toHaveBeenCalledWith(employee);
    expect(onDelete).toHaveBeenCalledWith(2);
  });

  it('renders employee empty and filtered states', () => {
    const props = {
      items: [],
      organizations: [],
      form: { name: '', jobTitle: '', email: '', orgId: '' },
      formOpen: false,
      editingId: null,
      loading: false,
      organizationName: () => '',
      onSearchChange: vi.fn(),
      onOpenAdd: vi.fn(),
      onSubmit: vi.fn(),
      onChange: vi.fn(),
      onCancel: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    };
    const { rerender } = render(<EmployeeSection {...props} searchValue="" />);
    expect(screen.getByText('No employees found')).toBeInTheDocument();
    rerender(<EmployeeSection {...props} searchValue="absent" />);
    expect(screen.getByText('No matching employees')).toBeInTheDocument();
  });
});

describe('venue section', () => {
  it('renders form, capacity and venue rows, and cancellation', () => {
    const onCancel = vi.fn();
    const onChange = vi.fn();
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(
      <VenueSection
        items={[venue]}
        searchValue=""
        form={{ address: 'Main Hall', capacity: '250' }}
        formOpen
        loading={false}
        onSearchChange={vi.fn()}
        onOpenAdd={vi.fn()}
        onSubmit={onSubmit}
        onChange={onChange}
        onCancel={onCancel}
      />,
    );
    expect(screen.getAllByText('Main Hall')).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('Capacity'), { target: { value: '300' } });
    expect(onChange).toHaveBeenCalledOnce();
    fireEvent.submit(screen.getByRole('heading', { name: 'Add Venue' }).closest('form')!);
    expect(onSubmit).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('renders venue empty guidance and filtered guidance', () => {
    const props = {
      items: [],
      form: { address: '', capacity: '' },
      formOpen: false,
      loading: false,
      onSearchChange: vi.fn(),
      onOpenAdd: vi.fn(),
      onSubmit: vi.fn(),
      onChange: vi.fn(),
      onCancel: vi.fn(),
    };
    const { rerender } = render(<VenueSection {...props} searchValue="" />);
    expect(screen.getByText('No venues found')).toBeInTheDocument();
    rerender(<VenueSection {...props} searchValue="missing" />);
    expect(screen.getByText('No matching venues')).toBeInTheDocument();
  });
});
