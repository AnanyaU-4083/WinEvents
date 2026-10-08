import { useEffect, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import type { AccountInfo } from '@azure/msal-browser'

import SearchBar from '../Components/SearchBar'

type AdminSection =
  | 'organizations'
  | 'employees'
  | 'venues'

interface Organization {
  orgId: number
  name: string
  email: string
  phone: string
  contactPerson: string
}

interface Employee {
  employeeId: number
  name: string
  jobTitle: string
  email: string
  orgId: number
}

interface Venue {
  venueId: number
  address: string
  capacity: number
}

interface OrganizationForm {
  name: string
  email: string
  phone: string
  contactPerson: string
}

interface EmployeeForm {
  name: string
  jobTitle: string
  email: string
  orgId: string
}

interface VenueForm {
  address: string
  capacity: string
}

function Administration() {
  const { instance, accounts } = useMsal()

  const account: AccountInfo | undefined =
    instance.getActiveAccount() ?? accounts[0]

  const [activeSection, setActiveSection] =
    useState<AdminSection>('organizations')

  const [organizations, setOrganizations] =
    useState<Organization[]>([])

  const [employees, setEmployees] =
    useState<Employee[]>([])

  const [venues, setVenues] =
    useState<Venue[]>([])

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  // FILTERS

  const [organizationSearch, setOrganizationSearch] =
    useState('')

  const [employeeSearch, setEmployeeSearch] =
    useState('')

  const [venueSearch, setVenueSearch] =
    useState('')

  // Organization form

  const [showOrganizationForm, setShowOrganizationForm] =
    useState(false)

  const [editingOrganizationId, setEditingOrganizationId] =
    useState<number | null>(null)

  const [organizationForm, setOrganizationForm] =
    useState<OrganizationForm>({
      name: '',
      email: '',
      phone: '',
      contactPerson: '',
    })

  // Employee form

  const [showEmployeeForm, setShowEmployeeForm] =
    useState(false)

  const [editingEmployeeId, setEditingEmployeeId] =
    useState<number | null>(null)

  const [employeeForm, setEmployeeForm] =
    useState<EmployeeForm>({
      name: '',
      jobTitle: '',
      email: '',
      orgId: '',
    })

  // Venue form

  const [showVenueForm, setShowVenueForm] =
    useState(false)

  const [venueForm, setVenueForm] =
    useState<VenueForm>({
      address: '',
      capacity: '',
    })

  // AUTH HEADERS

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    if (!account) {
      throw new Error(
        'No Microsoft account is logged in.'
      )
    }

    const response =
      await instance.acquireTokenSilent({
        scopes: [
          'api://0332cc25-1dc3-4542-b1cd-a1ad23d0f620/access_as_user',
        ],
        account,
      })

    return {
      Authorization: `Bearer ${response.accessToken}`,
    }
  }

  // LOAD ORGANIZATIONS

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        '/api/organizations',
        {
          method: 'GET',
          headers: {
            ...(await getAuthHeaders()),
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          `Failed to load organizations (${response.status})`
        )
      }

      const data =
        await response.json()

      setOrganizations(data)
    } catch (error) {
      console.error(error)

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load organizations.'
      )
    } finally {
      setLoading(false)
    }
  }

  // LOAD EMPLOYEES

  const loadEmployees = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        '/api/employees',
        {
          method: 'GET',
          headers: {
            ...(await getAuthHeaders()),
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          `Failed to load employees (${response.status})`
        )
      }

      const data =
        await response.json()

      setEmployees(data)
    } catch (error) {
      console.error(error)

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load employees.'
      )
    } finally {
      setLoading(false)
    }
  }

  // LOAD VENUES

  const loadVenues = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        '/api/venues',
        {
          method: 'GET',
        }
      )

      if (!response.ok) {
        throw new Error(
          `Failed to load venues (${response.status})`
        )
      }

      const data =
        await response.json()

      setVenues(data)
    } catch (error) {
      console.error(error)

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load venues.'
      )
    } finally {
      setLoading(false)
    }
  }

  // LOAD DATA WHEN TAB CHANGES

  useEffect(() => {
    if (
      activeSection ===
      'organizations'
    ) {
      loadOrganizations()
    }

    if (
      activeSection ===
      'employees'
    ) {
      loadOrganizations()
      loadEmployees()
    }

    if (
      activeSection ===
      'venues'
    ) {
      loadVenues()
    }
  }, [activeSection])

  // ORGANIZATION FORM

  const openAddOrganization = () => {
    setEditingOrganizationId(null)

    setOrganizationForm({
      name: '',
      email: '',
      phone: '',
      contactPerson: '',
    })

    setShowOrganizationForm(true)
    setError('')
  }

  const openEditOrganization = (
    organization: Organization
  ) => {
    setEditingOrganizationId(
      organization.orgId
    )

    setOrganizationForm({
      name: organization.name,
      email: organization.email,
      phone: organization.phone,
      contactPerson:
        organization.contactPerson ||
        '',
    })

    setShowOrganizationForm(true)
    setError('')
  }

  const handleOrganizationChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } =
      event.target

    setOrganizationForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    )
  }

  const saveOrganization = async (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    try {
      setLoading(true)
      setError('')

      const isEditing =
        editingOrganizationId !==
        null

      const url = isEditing
        ? `/api/organizations/${editingOrganizationId}`
        : '/api/organizations'

      const response =
        await fetch(url, {
          method: isEditing
            ? 'PUT'
            : 'POST',

          headers: {
            'Content-Type':
              'application/json',
            ...(await getAuthHeaders()),
          },

          body: JSON.stringify({
            name:
              organizationForm.name,

            email:
              organizationForm.email,

            phone:
              organizationForm.phone,

            contactPerson:
              organizationForm.contactPerson ||
              null,
          }),
        })

      if (!response.ok) {
        const message =
          await response.text()

        throw new Error(
          message ||
            `Failed to ${
              isEditing
                ? 'update'
                : 'create'
            } organization (${response.status})`
        )
      }

      setShowOrganizationForm(
        false
      )

      setEditingOrganizationId(
        null
      )

      await loadOrganizations()
    } catch (error) {
      console.error(error)

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to save organization.'
      )
    } finally {
      setLoading(false)
    }
  }

  // DELETE ORGANIZATION

  const deleteOrganization = async (
    organizationId: number
  ) => {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this organization?'
      )

    if (!confirmed) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const response =
        await fetch(
          `/api/organizations/${organizationId}`,
          {
            method: 'DELETE',
            headers: {
              ...(await getAuthHeaders()),
            },
          }
        )

      if (!response.ok) {
        const message =
          await response.text()

        throw new Error(
          message ||
            `Failed to delete organization (${response.status})`
        )
      }

      await loadOrganizations()
    } catch (error) {
      console.error(error)

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to delete organization.'
      )
    } finally {
      setLoading(false)
    }
  }

  // EMPLOYEE FORM

  const openAddEmployee = () => {
    setEditingEmployeeId(null)

    setEmployeeForm({
      name: '',
      jobTitle: '',
      email: '',
      orgId: '',
    })

    setShowEmployeeForm(true)
    setError('')
  }

  const openEditEmployee = (
    employee: Employee
  ) => {
    setEditingEmployeeId(
      employee.employeeId
    )

    setEmployeeForm({
      name: employee.name,
      jobTitle:
        employee.jobTitle || '',
      email: employee.email,
      orgId:
        employee.orgId.toString(),
    })

    setShowEmployeeForm(true)
    setError('')
  }

  const handleEmployeeChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } =
      event.target

    setEmployeeForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    )
  }

  const saveEmployee = async (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    try {
      setLoading(true)
      setError('')

      const isEditing =
        editingEmployeeId !==
        null

      const url = isEditing
        ? `/api/employees/${editingEmployeeId}`
        : '/api/employees'

      const response =
        await fetch(url, {
          method: isEditing
            ? 'PUT'
            : 'POST',

          headers: {
            'Content-Type':
              'application/json',
            ...(await getAuthHeaders()),
          },

          body: JSON.stringify({
            name:
              employeeForm.name,

            jobTitle:
              employeeForm.jobTitle,

            email:
              employeeForm.email,

            orgId:
              Number(
                employeeForm.orgId
              ),
          }),
        })

      if (!response.ok) {
        const message =
          await response.text()

        throw new Error(
          message ||
            `Failed to ${
              isEditing
                ? 'update'
                : 'create'
            } employee (${response.status})`
        )
      }

      setShowEmployeeForm(
        false
      )

      setEditingEmployeeId(null)

      await loadEmployees()
    } catch (error) {
      console.error(error)

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to save employee.'
      )
    } finally {
      setLoading(false)
    }
  }

  // DELETE EMPLOYEE

  const deleteEmployee = async (
    employeeId: number
  ) => {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this employee?'
      )

    if (!confirmed) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const response =
        await fetch(
          `/api/employees/${employeeId}`,
          {
            method: 'DELETE',
            headers: {
              ...(await getAuthHeaders()),
            },
          }
        )

      if (!response.ok) {
        const message =
          await response.text()

        throw new Error(
          message ||
            `Failed to delete employee (${response.status})`
        )
      }

      await loadEmployees()
    } catch (error) {
      console.error(error)

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to delete employee.'
      )
    } finally {
      setLoading(false)
    }
  }

  // VENUE FORM

  const openAddVenue = () => {
    setVenueForm({
      address: '',
      capacity: '',
    })

    setShowVenueForm(true)
    setError('')
  }

  const handleVenueChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } =
      event.target

    setVenueForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    )
  }

  const saveVenue = async (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    try {
      setLoading(true)
      setError('')

      const response =
        await fetch(
          '/api/venues',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
              ...(await getAuthHeaders()),
            },

            body: JSON.stringify({
              address:
                venueForm.address,

              capacity:
                Number(
                  venueForm.capacity
                ),
            }),
          }
        )

      if (!response.ok) {
        const message =
          await response.text()

        throw new Error(
          message ||
            `Failed to create venue (${response.status})`
        )
      }

      setShowVenueForm(false)

      await loadVenues()
    } catch (error) {
      console.error(error)

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to create venue.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ORGANIZATION NAME

  const getOrganizationName = (
    orgId: number
  ) => {
    const organization =
      organizations.find(
        (item) =>
          item.orgId === orgId
      )

    return organization
      ? organization.name
      : 'Unknown'
  }

  // FILTERED DATA

  const filteredOrganizations =
    organizations.filter(
      (organization) => {
        const search =
          organizationSearch
            .toLowerCase()
            .trim()

        if (!search) {
          return true
        }

        return (
          organization.name
            .toLowerCase()
            .includes(search) ||
          organization.email
            .toLowerCase()
            .includes(search) ||
          organization.phone
            .toLowerCase()
            .includes(search) ||
          organization.contactPerson
            .toLowerCase()
            .includes(search)
        )
      }
    )

  const filteredEmployees =
    employees.filter(
      (employee) => {
        const search =
          employeeSearch
            .toLowerCase()
            .trim()

        if (!search) {
          return true
        }

        const organizationName =
          getOrganizationName(
            employee.orgId
          )

        return (
          employee.name
            .toLowerCase()
            .includes(search) ||
          employee.email
            .toLowerCase()
            .includes(search) ||
          employee.jobTitle
            .toLowerCase()
            .includes(search) ||
          organizationName
            .toLowerCase()
            .includes(search)
        )
      }
    )

  const filteredVenues =
    venues.filter(
      (venue) => {
        const search =
          venueSearch
            .toLowerCase()
            .trim()

        if (!search) {
          return true
        }

        return (
          venue.address
            .toLowerCase()
            .includes(search) ||
          venue.capacity
            .toString()
            .includes(search)
        )
      }
    )

  // TAILWIND CLASSES

  const inputClass =
    'w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20'

  const labelClass =
    'mb-1.5 block text-sm font-medium text-[#374151]'

  const primaryButtonClass =
    'rounded-lg bg-[#0066ff] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0052cc] disabled:cursor-not-allowed disabled:opacity-50'

  const secondaryButtonClass =
    'rounded-lg border border-[#dfe5ec] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] transition hover:border-[#0066ff] hover:bg-[#eaf2ff] hover:text-[#0052cc]'

  const deleteButtonClass =
    'rounded-lg border border-[#fee2e2] bg-white px-4 py-2.5 text-sm font-medium text-[#dc2626] transition hover:bg-[#fee2e2]'

  // UI

  return (
    <div className="min-h-full bg-[#f5f8fc] p-6 md:p-8">

      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

        <div>
          <h1 className="text-2xl font-bold text-[#111827]">
            Administration
          </h1>

          <p className="mt-1 text-sm text-[#6b7280]">
            Manage organizations, employees, and venues.
          </p>
        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-lg border border-[#fecaca] bg-[#fee2e2] px-4 py-3 text-sm text-[#b91c1c]">
          {error}
        </div>
      )}

      {/* TABS */}

      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-[#dfe5ec] bg-white p-1 shadow-sm">

        <button
          type="button"
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeSection ===
            'organizations'
              ? 'bg-[#eaf2ff] text-[#0066ff]'
              : 'text-[#6b7280] hover:bg-[#f5f8fc] hover:text-[#374151]'
          }`}
          onClick={() =>
            setActiveSection(
              'organizations'
            )
          }
        >
          Organizations
        </button>

        <button
          type="button"
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeSection ===
            'employees'
              ? 'bg-[#eaf2ff] text-[#0066ff]'
              : 'text-[#6b7280] hover:bg-[#f5f8fc] hover:text-[#374151]'
          }`}
          onClick={() =>
            setActiveSection(
              'employees'
            )
          }
        >
          Employees
        </button>

        <button
          type="button"
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeSection ===
            'venues'
              ? 'bg-[#eaf2ff] text-[#0066ff]'
              : 'text-[#6b7280] hover:bg-[#f5f8fc] hover:text-[#374151]'
          }`}
          onClick={() =>
            setActiveSection(
              'venues'
            )
          }
        >
          Venues
        </button>

      </div>

      {/* ORGANIZATIONS */}

      {activeSection ===
        'organizations' && (
        <div className="rounded-xl border border-[#dfe5ec] bg-white p-6 shadow-sm">

          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>
              <h2 className="text-lg font-semibold text-[#111827]">
                Organizations
              </h2>

              <p className="mt-1 text-sm text-[#6b7280]">
                Create and manage event organizations.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">

              <SearchBar
                value={
                  organizationSearch
                }
                onChange={
                  setOrganizationSearch
                }
                placeholder="Search organizations..."
              />

              <button
                type="button"
                className={
                  primaryButtonClass
                }
                onClick={
                  openAddOrganization
                }
              >
                + Add Organization
              </button>

            </div>

          </div>

          {/* ORGANIZATION FORM */}

          {showOrganizationForm && (
            <form
              onSubmit={
                saveOrganization
              }
              className="mb-6 rounded-xl border border-[#dfe5ec] bg-[#f8fafc] p-5"
            >

              <h3 className="mb-5 text-base font-semibold text-[#111827]">
                {editingOrganizationId !==
                null
                  ? 'Edit Organization'
                  : 'Add Organization'}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>
                  <label
                    className={
                      labelClass
                    }
                  >
                    Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      organizationForm.name
                    }
                    onChange={
                      handleOrganizationChange
                    }
                    required
                    className={
                      inputClass
                    }
                  />
                </div>

                <div>
                  <label
                    className={
                      labelClass
                    }
                  >
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      organizationForm.email
                    }
                    onChange={
                      handleOrganizationChange
                    }
                    required
                    className={
                      inputClass
                    }
                  />
                </div>

                <div>
                  <label
                    className={
                      labelClass
                    }
                  >
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={
                      organizationForm.phone
                    }
                    onChange={
                      handleOrganizationChange
                    }
                    required
                    className={
                      inputClass
                    }
                  />
                </div>

                <div>
                  <label
                    className={
                      labelClass
                    }
                  >
                    Contact Person
                  </label>

                  <input
                    type="text"
                    name="contactPerson"
                    value={
                      organizationForm.contactPerson
                    }
                    onChange={
                      handleOrganizationChange
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">

                <button
                  type="button"
                  className={
                    secondaryButtonClass
                  }
                  onClick={() =>
                    setShowOrganizationForm(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={
                    primaryButtonClass
                  }
                  disabled={loading}
                >
                  {loading
                    ? 'Saving...'
                    : editingOrganizationId !==
                      null
                    ? 'Update Organization'
                    : 'Add Organization'}
                </button>

              </div>

            </form>
          )}

          {/* ORGANIZATION TABLE */}

          <div className="overflow-x-auto rounded-lg border border-[#edf0f4]">

            <table className="w-full min-w-[760px] border-collapse text-left">

              <thead>
                <tr className="border-b border-[#edf0f4] bg-[#f8fafc]">

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Organization
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Email
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Phone
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Contact Person
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredOrganizations.length ===
                0 ? (
                  <tr>

                    <td
                      colSpan={5}
                      className="px-4 py-10"
                    >

                      <div className="text-center">

                        <h3 className="text-base font-semibold text-[#111827]">
                          {organizationSearch
                            ? 'No matching organizations'
                            : 'No organizations found'}
                        </h3>

                        <p className="mt-1 text-sm text-[#6b7280]">
                          {organizationSearch
                            ? 'Try a different search.'
                            : 'Organizations will appear here.'}
                        </p>

                      </div>

                    </td>

                  </tr>
                ) : (
                  filteredOrganizations.map(
                    (organization) => (
                      <tr
                        key={
                          organization.orgId
                        }
                        className="border-b border-[#edf0f4] last:border-b-0 hover:bg-[#f8fafc]"
                      >

                        <td className="px-4 py-3 text-sm text-[#374151]">
                          {
                            organization.name
                          }
                        </td>

                        <td className="px-4 py-3 text-sm text-[#374151]">
                          {
                            organization.email
                          }
                        </td>

                        <td className="px-4 py-3 text-sm text-[#374151]">
                          {
                            organization.phone
                          }
                        </td>

                        <td className="px-4 py-3 text-sm text-[#374151]">
                          {
                            organization.contactPerson ||
                            '-'
                          }
                        </td>

                        <td className="px-4 py-3">

                          <div className="flex flex-wrap gap-2">

                            <button
                              type="button"
                              className={
                                secondaryButtonClass
                              }
                              onClick={() =>
                                openEditOrganization(
                                  organization
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className={
                                deleteButtonClass
                              }
                              onClick={() =>
                                deleteOrganization(
                                  organization.orgId
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* EMPLOYEES */}

      {activeSection ===
        'employees' && (
        <div className="rounded-xl border border-[#dfe5ec] bg-white p-6 shadow-sm">

          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>
              <h2 className="text-lg font-semibold text-[#111827]">
                Employees
              </h2>

              <p className="mt-1 text-sm text-[#6b7280]">
                Create and manage employees.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">

              <SearchBar
                value={
                  employeeSearch
                }
                onChange={
                  setEmployeeSearch
                }
                placeholder="Search employees..."
              />

              <button
                type="button"
                className={
                  primaryButtonClass
                }
                onClick={
                  openAddEmployee
                }
              >
                + Add Employee
              </button>

            </div>

          </div>

          {/* EMPLOYEE FORM */}

          {showEmployeeForm && (
            <form
              onSubmit={saveEmployee}
              className="mb-6 rounded-xl border border-[#dfe5ec] bg-[#f8fafc] p-5"
            >

              <h3 className="mb-5 text-base font-semibold text-[#111827]">
                {editingEmployeeId !==
                null
                  ? 'Edit Employee'
                  : 'Add Employee'}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>
                  <label
                    className={
                      labelClass
                    }
                  >
                    Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      employeeForm.name
                    }
                    onChange={
                      handleEmployeeChange
                    }
                    required
                    className={
                      inputClass
                    }
                  />
                </div>

                <div>
                  <label
                    className={
                      labelClass
                    }
                  >
                    Job Title
                  </label>

                  <input
                    type="text"
                    name="jobTitle"
                    value={
                      employeeForm.jobTitle
                    }
                    onChange={
                      handleEmployeeChange
                    }
                    required
                    className={
                      inputClass
                    }
                  />
                </div>

                <div>
                  <label
                    className={
                      labelClass
                    }
                  >
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      employeeForm.email
                    }
                    onChange={
                      handleEmployeeChange
                    }
                    required
                    className={
                      inputClass
                    }
                  />
                </div>

                <div>
                  <label
                    className={
                      labelClass
                    }
                  >
                    Organization
                  </label>

                  <select
                    name="orgId"
                    value={
                      employeeForm.orgId
                    }
                    onChange={
                      handleEmployeeChange
                    }
                    required
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      Select organization
                    </option>

                    {organizations.map(
                      (
                        organization
                      ) => (
                        <option
                          key={
                            organization.orgId
                          }
                          value={
                            organization.orgId
                          }
                        >
                          {
                            organization.name
                          }
                        </option>
                      )
                    )}

                  </select>
                </div>

              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">

                <button
                  type="button"
                  className={
                    secondaryButtonClass
                  }
                  onClick={() =>
                    setShowEmployeeForm(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={
                    primaryButtonClass
                  }
                  disabled={loading}
                >
                  {loading
                    ? 'Saving...'
                    : editingEmployeeId !==
                      null
                    ? 'Update Employee'
                    : 'Add Employee'}
                </button>

              </div>

            </form>
          )}

          {/* EMPLOYEE TABLE */}

          <div className="overflow-x-auto rounded-lg border border-[#edf0f4]">

            <table className="w-full min-w-[760px] border-collapse text-left">

              <thead>
                <tr className="border-b border-[#edf0f4] bg-[#f8fafc]">

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Name
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Email
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Job Title
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Organization
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredEmployees.length ===
                0 ? (
                  <tr>

                    <td
                      colSpan={5}
                      className="px-4 py-10"
                    >

                      <div className="text-center">

                        <h3 className="text-base font-semibold text-[#111827]">
                          {employeeSearch
                            ? 'No matching employees'
                            : 'No employees found'}
                        </h3>

                        <p className="mt-1 text-sm text-[#6b7280]">
                          {employeeSearch
                            ? 'Try a different search.'
                            : 'Employees will appear here.'}
                        </p>

                      </div>

                    </td>

                  </tr>
                ) : (
                  filteredEmployees.map(
                    (employee) => (
                      <tr
                        key={
                          employee.employeeId
                        }
                        className="border-b border-[#edf0f4] last:border-b-0 hover:bg-[#f8fafc]"
                      >

                        <td className="px-4 py-3 text-sm text-[#374151]">
                          {
                            employee.name
                          }
                        </td>

                        <td className="px-4 py-3 text-sm text-[#374151]">
                          {
                            employee.email
                          }
                        </td>

                        <td className="px-4 py-3 text-sm text-[#374151]">
                          {
                            employee.jobTitle
                          }
                        </td>

                        <td className="px-4 py-3 text-sm text-[#374151]">
                          {getOrganizationName(
                            employee.orgId
                          )}
                        </td>

                        <td className="px-4 py-3">

                          <div className="flex flex-wrap gap-2">

                            <button
                              type="button"
                              className={
                                secondaryButtonClass
                              }
                              onClick={() =>
                                openEditEmployee(
                                  employee
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className={
                                deleteButtonClass
                              }
                              onClick={() =>
                                deleteEmployee(
                                  employee.employeeId
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* VENUES */}

      {activeSection ===
        'venues' && (
        <div className="rounded-xl border border-[#dfe5ec] bg-white p-6 shadow-sm">

          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>
              <h2 className="text-lg font-semibold text-[#111827]">
                Venues
              </h2>

              <p className="mt-1 text-sm text-[#6b7280]">
                View and manage event venues.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">

              <SearchBar
                value={
                  venueSearch
                }
                onChange={
                  setVenueSearch
                }
                placeholder="Search venues..."
              />

              <button
                type="button"
                className={
                  primaryButtonClass
                }
                onClick={
                  openAddVenue
                }
              >
                + Add Venue
              </button>

            </div>

          </div>

          {/* VENUE FORM */}

          {showVenueForm && (
            <form
              onSubmit={saveVenue}
              className="mb-6 rounded-xl border border-[#dfe5ec] bg-[#f8fafc] p-5"
            >

              <h3 className="mb-5 text-base font-semibold text-[#111827]">
                Add Venue
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>
                  <label
                    className={
                      labelClass
                    }
                  >
                    Address
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={
                      venueForm.address
                    }
                    onChange={
                      handleVenueChange
                    }
                    required
                    className={
                      inputClass
                    }
                  />
                </div>

                <div>
                  <label
                    className={
                      labelClass
                    }
                  >
                    Capacity
                  </label>

                  <input
                    type="number"
                    name="capacity"
                    value={
                      venueForm.capacity
                    }
                    onChange={
                      handleVenueChange
                    }
                    min="1"
                    required
                    className={
                      inputClass
                    }
                  />
                </div>

              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">

                <button
                  type="button"
                  className={
                    secondaryButtonClass
                  }
                  onClick={() =>
                    setShowVenueForm(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={
                    primaryButtonClass
                  }
                  disabled={loading}
                >
                  {loading
                    ? 'Saving...'
                    : 'Add Venue'}
                </button>

              </div>

            </form>
          )}

          {/* VENUE TABLE */}

          <div className="overflow-x-auto rounded-lg border border-[#edf0f4]">

            <table className="w-full min-w-[600px] border-collapse text-left">

              <thead>
                <tr className="border-b border-[#edf0f4] bg-[#f8fafc]">

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Venue
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Location
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Capacity
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredVenues.length ===
                0 ? (
                  <tr>

                    <td
                      colSpan={3}
                      className="px-4 py-10"
                    >

                      <div className="text-center">

                        <h3 className="text-base font-semibold text-[#111827]">
                          {venueSearch
                            ? 'No matching venues'
                            : 'No venues found'}
                        </h3>

                        <p className="mt-1 text-sm text-[#6b7280]">
                          {venueSearch
                            ? 'Try a different search.'
                            : 'Venues will appear here.'}
                        </p>

                      </div>

                    </td>

                  </tr>
                ) : (
                  filteredVenues.map(
                    (venue) => (
                      <tr
                        key={
                          venue.venueId
                        }
                        className="border-b border-[#edf0f4] last:border-b-0 hover:bg-[#f8fafc]"
                      >

                        <td className="px-4 py-3 text-sm text-[#374151]">
                          {
                            venue.address
                          }
                        </td>

                        <td className="px-4 py-3 text-sm text-[#374151]">
                          {
                            venue.address
                          }
                        </td>

                        <td className="px-4 py-3 text-sm text-[#374151]">
                          {
                            venue.capacity
                          }
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

    </div>
  )
}

export default Administration