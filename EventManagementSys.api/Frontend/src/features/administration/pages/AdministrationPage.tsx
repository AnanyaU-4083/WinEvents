import { apiRequest } from '../../../shared/api/apiClient';
import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import type { AccountInfo } from '@azure/msal-browser';

import PageHeader from '@/shared/components/PageHeader';
import {
  EmployeeSection,
  OrganizationSection,
  VenueSection,
} from '@/features/administration/components/AdministrationSections';

type AdminSection = 'organizations' | 'employees' | 'venues';

interface Organization {
  orgId: number;
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
}

interface Employee {
  employeeId: number;
  name: string;
  jobTitle: string;
  email: string;
  orgId: number;
}

interface Venue {
  venueId: number;
  address: string;
  capacity: number;
}

interface OrganizationForm {
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
}

interface EmployeeForm {
  name: string;
  jobTitle: string;
  email: string;
  orgId: string;
}

interface VenueForm {
  address: string;
  capacity: string;
}

function AdministrationPage() {
  const { instance, accounts } = useMsal();

  const account: AccountInfo | undefined = instance.getActiveAccount() ?? accounts[0];

  const [activeSection, setActiveSection] = useState<AdminSection>('organizations');

  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [venues, setVenues] = useState<Venue[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  // FILTERS

  const [organizationSearch, setOrganizationSearch] = useState('');

  const [employeeSearch, setEmployeeSearch] = useState('');

  const [venueSearch, setVenueSearch] = useState('');

  // Organization form

  const [showOrganizationForm, setShowOrganizationForm] = useState(false);

  const [editingOrganizationId, setEditingOrganizationId] = useState<number | null>(null);

  const [organizationForm, setOrganizationForm] = useState<OrganizationForm>({
    name: '',
    email: '',
    phone: '',
    contactPerson: '',
  });

  // Employee form

  const [showEmployeeForm, setShowEmployeeForm] = useState(false);

  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);

  const [employeeForm, setEmployeeForm] = useState<EmployeeForm>({
    name: '',
    jobTitle: '',
    email: '',
    orgId: '',
  });

  // Venue form

  const [showVenueForm, setShowVenueForm] = useState(false);

  const [venueForm, setVenueForm] = useState<VenueForm>({
    address: '',
    capacity: '',
  });

  // AUTH HEADERS

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    if (!account) {
      throw new Error('No Microsoft account is logged in.');
    }

    const response = await instance.acquireTokenSilent({
      scopes: ['api://0332cc25-1dc3-4542-b1cd-a1ad23d0f620/access_as_user'],
      account,
    });

    return {
      Authorization: `Bearer ${response.accessToken}`,
    };
  };

  // LOAD ORGANIZATIONS

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiRequest('/api/organizations', {
        method: 'GET',
        headers: {
          ...(await getAuthHeaders()),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load organizations (${response.status})`);
      }

      const data = await response.json();

      setOrganizations(data);
    } catch (error) {
      console.error(error);

      setError(error instanceof Error ? error.message : 'Failed to load organizations.');
    } finally {
      setLoading(false);
    }
  };

  // LOAD EMPLOYEES

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiRequest('/api/employees', {
        method: 'GET',
        headers: {
          ...(await getAuthHeaders()),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load employees (${response.status})`);
      }

      const data = await response.json();

      setEmployees(data);
    } catch (error) {
      console.error(error);

      setError(error instanceof Error ? error.message : 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };

  // LOAD VENUES

  const loadVenues = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiRequest('/api/venues', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to load venues (${response.status})`);
      }

      const data = await response.json();

      setVenues(data);
    } catch (error) {
      console.error(error);

      setError(error instanceof Error ? error.message : 'Failed to load venues.');
    } finally {
      setLoading(false);
    }
  };

  // LOAD DATA WHEN TAB CHANGES

  useEffect(() => {
    if (activeSection === 'organizations') {
      loadOrganizations();
    }

    if (activeSection === 'employees') {
      loadOrganizations();
      loadEmployees();
    }

    if (activeSection === 'venues') {
      loadVenues();
    }
    // The data loaders intentionally run only when the selected section changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // ORGANIZATION FORM

  const openAddOrganization = () => {
    setEditingOrganizationId(null);

    setOrganizationForm({
      name: '',
      email: '',
      phone: '',
      contactPerson: '',
    });

    setShowOrganizationForm(true);
    setError('');
  };

  const openEditOrganization = (organization: Organization) => {
    setEditingOrganizationId(organization.orgId);

    setOrganizationForm({
      name: organization.name,
      email: organization.email,
      phone: organization.phone,
      contactPerson: organization.contactPerson || '',
    });

    setShowOrganizationForm(true);
    setError('');
  };

  const handleOrganizationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setOrganizationForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveOrganization = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');

      const isEditing = editingOrganizationId !== null;

      const url = isEditing ? `/api/organizations/${editingOrganizationId}` : '/api/organizations';

      const response = await apiRequest(url, {
        method: isEditing ? 'PUT' : 'POST',

        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },

        body: JSON.stringify({
          name: organizationForm.name,

          email: organizationForm.email,

          phone: organizationForm.phone,

          contactPerson: organizationForm.contactPerson || null,
        }),
      });

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          message ||
            `Failed to ${isEditing ? 'update' : 'create'} organization (${response.status})`,
        );
      }

      setShowOrganizationForm(false);

      setEditingOrganizationId(null);

      await loadOrganizations();
    } catch (error) {
      console.error(error);

      setError(error instanceof Error ? error.message : 'Failed to save organization.');
    } finally {
      setLoading(false);
    }
  };

  // DELETE ORGANIZATION

  const deleteOrganization = async (organizationId: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this organization?');

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await apiRequest(`/api/organizations/${organizationId}`, {
        method: 'DELETE',
        headers: {
          ...(await getAuthHeaders()),
        },
      });

      if (!response.ok) {
        const message = await response.text();

        throw new Error(message || `Failed to delete organization (${response.status})`);
      }

      await loadOrganizations();
    } catch (error) {
      console.error(error);

      setError(error instanceof Error ? error.message : 'Failed to delete organization.');
    } finally {
      setLoading(false);
    }
  };

  // EMPLOYEE FORM

  const openAddEmployee = () => {
    setEditingEmployeeId(null);

    setEmployeeForm({
      name: '',
      jobTitle: '',
      email: '',
      orgId: '',
    });

    setShowEmployeeForm(true);
    setError('');
  };

  const openEditEmployee = (employee: Employee) => {
    setEditingEmployeeId(employee.employeeId);

    setEmployeeForm({
      name: employee.name,
      jobTitle: employee.jobTitle || '',
      email: employee.email,
      orgId: employee.orgId.toString(),
    });

    setShowEmployeeForm(true);
    setError('');
  };

  const handleEmployeeChange = (
    event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setEmployeeForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveEmployee = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');

      const isEditing = editingEmployeeId !== null;

      const url = isEditing ? `/api/employees/${editingEmployeeId}` : '/api/employees';

      const response = await apiRequest(url, {
        method: isEditing ? 'PUT' : 'POST',

        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },

        body: JSON.stringify({
          name: employeeForm.name,

          jobTitle: employeeForm.jobTitle,

          email: employeeForm.email,

          orgId: Number(employeeForm.orgId),
        }),
      });

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          message || `Failed to ${isEditing ? 'update' : 'create'} employee (${response.status})`,
        );
      }

      setShowEmployeeForm(false);

      setEditingEmployeeId(null);

      await loadEmployees();
    } catch (error) {
      console.error(error);

      setError(error instanceof Error ? error.message : 'Failed to save employee.');
    } finally {
      setLoading(false);
    }
  };

  // DELETE EMPLOYEE

  const deleteEmployee = async (employeeId: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this employee?');

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await apiRequest(`/api/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          ...(await getAuthHeaders()),
        },
      });

      if (!response.ok) {
        const message = await response.text();

        throw new Error(message || `Failed to delete employee (${response.status})`);
      }

      await loadEmployees();
    } catch (error) {
      console.error(error);

      setError(error instanceof Error ? error.message : 'Failed to delete employee.');
    } finally {
      setLoading(false);
    }
  };

  // VENUE FORM

  const openAddVenue = () => {
    setVenueForm({
      address: '',
      capacity: '',
    });

    setShowVenueForm(true);
    setError('');
  };

  const handleVenueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setVenueForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveVenue = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');

      const response = await apiRequest('/api/venues', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },

        body: JSON.stringify({
          address: venueForm.address,

          capacity: Number(venueForm.capacity),
        }),
      });

      if (!response.ok) {
        const message = await response.text();

        throw new Error(message || `Failed to create venue (${response.status})`);
      }

      setShowVenueForm(false);

      await loadVenues();
    } catch (error) {
      console.error(error);

      setError(error instanceof Error ? error.message : 'Failed to create venue.');
    } finally {
      setLoading(false);
    }
  };

  // ORGANIZATION NAME

  const getOrganizationName = (orgId: number) => {
    const organization = organizations.find((item) => item.orgId === orgId);

    return organization ? organization.name : 'Unknown';
  };

  // FILTERED DATA

  const filteredOrganizations = organizations.filter((organization) => {
    const search = organizationSearch.toLowerCase().trim();

    if (!search) {
      return true;
    }

    return (
      organization.name.toLowerCase().includes(search) ||
      organization.email.toLowerCase().includes(search) ||
      organization.phone.toLowerCase().includes(search) ||
      organization.contactPerson.toLowerCase().includes(search)
    );
  });

  const filteredEmployees = employees.filter((employee) => {
    const search = employeeSearch.toLowerCase().trim();

    if (!search) {
      return true;
    }

    const organizationName = getOrganizationName(employee.orgId);

    return (
      employee.name.toLowerCase().includes(search) ||
      employee.email.toLowerCase().includes(search) ||
      employee.jobTitle.toLowerCase().includes(search) ||
      organizationName.toLowerCase().includes(search)
    );
  });

  const filteredVenues = venues.filter((venue) => {
    const search = venueSearch.toLowerCase().trim();

    if (!search) {
      return true;
    }

    return (
      venue.address.toLowerCase().includes(search) || venue.capacity.toString().includes(search)
    );
  });

  // UI

  return (
    <div className="min-h-full bg-surface-subtle p-6 md:p-8">
      <PageHeader
        title="Administration"
        description="Manage organizations, employees, and venues."
        layout="responsive"
      />

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-lg border border-error-border bg-surface-error px-4 py-3 text-sm text-state-error-strong">
          {error}
        </div>
      )}

      {/* TABS */}

      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-border-accent/35 bg-white p-1 shadow-raised">
        <button
          type="button"
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeSection === 'organizations'
              ? 'bg-surface-blue text-brand-primary'
              : 'text-text-muted hover:bg-surface-subtle hover:text-text-secondary'
          }`}
          onClick={() => setActiveSection('organizations')}
        >
          Organizations
        </button>

        <button
          type="button"
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeSection === 'employees'
              ? 'bg-surface-blue text-brand-primary'
              : 'text-text-muted hover:bg-surface-subtle hover:text-text-secondary'
          }`}
          onClick={() => setActiveSection('employees')}
        >
          Employees
        </button>

        <button
          type="button"
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeSection === 'venues'
              ? 'bg-surface-blue text-brand-primary'
              : 'text-text-muted hover:bg-surface-subtle hover:text-text-secondary'
          }`}
          onClick={() => setActiveSection('venues')}
        >
          Venues
        </button>
      </div>

      {/* ORGANIZATIONS */}
      {activeSection === 'organizations' && (
        <OrganizationSection
          items={filteredOrganizations}
          searchValue={organizationSearch}
          form={organizationForm}
          formOpen={showOrganizationForm}
          editingId={editingOrganizationId}
          loading={loading}
          onSearchChange={setOrganizationSearch}
          onOpenAdd={openAddOrganization}
          onSubmit={saveOrganization}
          onChange={handleOrganizationChange}
          onCancel={() => setShowOrganizationForm(false)}
          onEdit={openEditOrganization}
          onDelete={deleteOrganization}
        />
      )}

      {/* EMPLOYEES */}
      {activeSection === 'employees' && (
        <EmployeeSection
          items={filteredEmployees}
          organizations={organizations}
          searchValue={employeeSearch}
          form={employeeForm}
          formOpen={showEmployeeForm}
          editingId={editingEmployeeId}
          loading={loading}
          organizationName={getOrganizationName}
          onSearchChange={setEmployeeSearch}
          onOpenAdd={openAddEmployee}
          onSubmit={saveEmployee}
          onChange={handleEmployeeChange}
          onCancel={() => setShowEmployeeForm(false)}
          onEdit={openEditEmployee}
          onDelete={deleteEmployee}
        />
      )}

      {/* VENUES */}
      {activeSection === 'venues' && (
        <VenueSection
          items={filteredVenues}
          searchValue={venueSearch}
          form={venueForm}
          formOpen={showVenueForm}
          loading={loading}
          onSearchChange={setVenueSearch}
          onOpenAdd={openAddVenue}
          onSubmit={saveVenue}
          onChange={handleVenueChange}
          onCancel={() => setShowVenueForm(false)}
        />
      )}
    </div>
  );
}

export default AdministrationPage;
