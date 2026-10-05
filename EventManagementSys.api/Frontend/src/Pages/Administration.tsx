import { useEffect, useState } from 'react'

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
  

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}
  }

  
  // LOAD ORGANIZATIONS
  

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/organizations', {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
        },
      })

      if (!response.ok) {
        throw new Error(
          `Failed to load organizations (${response.status})`
        )
      }

      const data = await response.json()

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

  // --------------------------------------------------
  // LOAD EMPLOYEES
  // --------------------------------------------------

  const loadEmployees = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/employees', {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
        },
      })

      if (!response.ok) {
        throw new Error(
          `Failed to load employees (${response.status})`
        )
      }

      const data = await response.json()

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

      const response = await fetch('/api/venues', {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(
          `Failed to load venues (${response.status})`
        )
      }

      const data = await response.json()

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
    if (activeSection === 'organizations') {
      loadOrganizations()
    }

    if (activeSection === 'employees') {
      loadOrganizations()
      loadEmployees()
    }

    if (activeSection === 'venues') {
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
    setEditingOrganizationId(organization.orgId)

    setOrganizationForm({
      name: organization.name,
      email: organization.email,
      phone: organization.phone,
      contactPerson: organization.contactPerson || '',
    })

    setShowOrganizationForm(true)
    setError('')
  }

  const handleOrganizationChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target

    setOrganizationForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const saveOrganization = async (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    try {
      setLoading(true)
      setError('')

      const isEditing =
        editingOrganizationId !== null

      const url = isEditing
        ? `/api/organizations/${editingOrganizationId}`
        : '/api/organizations'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',

        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },

        body: JSON.stringify({
          name: organizationForm.name,
          email: organizationForm.email,
          phone: organizationForm.phone,
          contactPerson:
            organizationForm.contactPerson || null,
        }),
      })

      if (!response.ok) {
        const message = await response.text()

        throw new Error(
          message ||
            `Failed to ${
              isEditing ? 'update' : 'create'
            } organization (${response.status})`
        )
      }

      setShowOrganizationForm(false)

      setEditingOrganizationId(null)

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

  // --------------------------------------------------
  // DELETE ORGANIZATION
  // --------------------------------------------------

  const deleteOrganization = async (
    organizationId: number
  ) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this organization?'
    )

    if (!confirmed) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `/api/organizations/${organizationId}`,
        {
          method: 'DELETE',
          headers: {
            ...getAuthHeaders(),
          },
        }
      )

      if (!response.ok) {
        const message = await response.text()

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
    setEditingEmployeeId(employee.employeeId)

    setEmployeeForm({
      name: employee.name,
      jobTitle: employee.jobTitle || '',
      email: employee.email,
      orgId: employee.orgId.toString(),
    })

    setShowEmployeeForm(true)
    setError('')
  }

  const handleEmployeeChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = event.target

    setEmployeeForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const saveEmployee = async (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    try {
      setLoading(true)
      setError('')

      const isEditing =
        editingEmployeeId !== null

      const url = isEditing
        ? `/api/employees/${editingEmployeeId}`
        : '/api/employees'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',

        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },

        body: JSON.stringify({
          name: employeeForm.name,
          jobTitle: employeeForm.jobTitle,
          email: employeeForm.email,
          orgId: Number(employeeForm.orgId),
        }),
      })

      if (!response.ok) {
        const message = await response.text()

        throw new Error(
          message ||
            `Failed to ${
              isEditing ? 'update' : 'create'
            } employee (${response.status})`
        )
      }

      setShowEmployeeForm(false)

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
    const confirmed = window.confirm(
      'Are you sure you want to delete this employee?'
    )

    if (!confirmed) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `/api/employees/${employeeId}`,
        {
          method: 'DELETE',
          headers: {
            ...getAuthHeaders(),
          },
        }
      )

      if (!response.ok) {
        const message = await response.text()

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
    const { name, value } = event.target

    setVenueForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const saveVenue = async (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/venues', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },

        body: JSON.stringify({
          address: venueForm.address,
          capacity: Number(venueForm.capacity),
        }),
      })

      if (!response.ok) {
        const message = await response.text()

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
  

  const getOrganizationName = (orgId: number) => {
    const organization = organizations.find(
      (item) => item.orgId === orgId
    )

    return organization
      ? organization.name
      : 'Unknown'
  }

  
  // UI
  

  return (
    <div className="page">

      <div className="page-header">

        <div>
          <h1>Administration</h1>

          <p>
            Manage organizations, employees, and venues.
          </p>
        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {/* TABS */}

      <div className="admin-tabs">

        <button
          type="button"
          className={
            activeSection === 'organizations'
              ? 'admin-tab active'
              : 'admin-tab'
          }
          onClick={() =>
            setActiveSection('organizations')
          }
        >
          Organizations
        </button>

        <button
          type="button"
          className={
            activeSection === 'employees'
              ? 'admin-tab active'
              : 'admin-tab'
          }
          onClick={() =>
            setActiveSection('employees')
          }
        >
          Employees
        </button>

        <button
          type="button"
          className={
            activeSection === 'venues'
              ? 'admin-tab active'
              : 'admin-tab'
          }
          onClick={() =>
            setActiveSection('venues')
          }
        >
          Venues
        </button>

      </div>

      
      {/* ORGANIZATIONS */}
      

      {activeSection === 'organizations' && (
        <div className="content-card">

          <div className="section-header">

            <div>
              <h2>Organizations</h2>

              <p>
                Create and manage event organizations.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={openAddOrganization}
            >
              + Add Organization
            </button>

          </div>

          {/* ORGANIZATION FORM */}

          {showOrganizationForm && (
            <form
              onSubmit={saveOrganization}
              className="content-card"
            >

              <h3>
                {editingOrganizationId !== null
                  ? 'Edit Organization'
                  : 'Add Organization'}
              </h3>

              <div className="form-grid">

                <div>
                  <label>Name</label>

                  <input
                    type="text"
                    name="name"
                    value={organizationForm.name}
                    onChange={handleOrganizationChange}
                    required
                  />
                </div>

                <div>
                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    value={organizationForm.email}
                    onChange={handleOrganizationChange}
                    required
                  />
                </div>

                <div>
                  <label>Phone</label>

                  <input
                    type="text"
                    name="phone"
                    value={organizationForm.phone}
                    onChange={handleOrganizationChange}
                    required
                  />
                </div>

                <div>
                  <label>Contact Person</label>

                  <input
                    type="text"
                    name="contactPerson"
                    value={
                      organizationForm.contactPerson
                    }
                    onChange={handleOrganizationChange}
                  />
                </div>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowOrganizationForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading
                    ? 'Saving...'
                    : editingOrganizationId !== null
                    ? 'Update Organization'
                    : 'Add Organization'}
                </button>

              </div>

            </form>
          )}

          {/* ORGANIZATION TABLE */}

          <div className="table-container">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Contact Person</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {organizations.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">

                        <h3>
                          No organizations found
                        </h3>

                        <p>
                          Organizations will appear here.
                        </p>

                      </div>
                    </td>
                  </tr>
                ) : (
                  organizations.map(
                    (organization) => (
                      <tr
                        key={organization.orgId}
                      >

                        <td>
                          {organization.name}
                        </td>

                        <td>
                          {organization.email}
                        </td>

                        <td>
                          {organization.phone}
                        </td>

                        <td>
                          {organization.contactPerson ||
                            '-'}
                        </td>

                        <td>

                          <button
                            type="button"
                            className="secondary-button"
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
                            className="secondary-button"
                            onClick={() =>
                              deleteOrganization(
                                organization.orgId
                              )
                            }
                          >
                            Delete
                          </button>

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

      {/* ================================================= */}
      {/* EMPLOYEES */}
      {/* ================================================= */}

      {activeSection === 'employees' && (
        <div className="content-card">

          <div className="section-header">

            <div>
              <h2>Employees</h2>

              <p>
                Create and manage employees.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={openAddEmployee}
            >
              + Add Employee
            </button>

          </div>

          {/* EMPLOYEE FORM */}

          {showEmployeeForm && (
            <form
              onSubmit={saveEmployee}
              className="content-card"
            >

              <h3>
                {editingEmployeeId !== null
                  ? 'Edit Employee'
                  : 'Add Employee'}
              </h3>

              <div className="form-grid">

                <div>
                  <label>Name</label>

                  <input
                    type="text"
                    name="name"
                    value={employeeForm.name}
                    onChange={handleEmployeeChange}
                    required
                  />
                </div>

                <div>
                  <label>Job Title</label>

                  <input
                    type="text"
                    name="jobTitle"
                    value={employeeForm.jobTitle}
                    onChange={handleEmployeeChange}
                    required
                  />
                </div>

                <div>
                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    value={employeeForm.email}
                    onChange={handleEmployeeChange}
                    required
                  />
                </div>

                <div>
                  <label>Organization</label>

                  <select
                    name="orgId"
                    value={employeeForm.orgId}
                    onChange={handleEmployeeChange}
                    required
                  >
                    <option value="">
                      Select organization
                    </option>

                    {organizations.map(
                      (organization) => (
                        <option
                          key={organization.orgId}
                          value={organization.orgId}
                        >
                          {organization.name}
                        </option>
                      )
                    )}

                  </select>
                </div>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowEmployeeForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading
                    ? 'Saving...'
                    : editingEmployeeId !== null
                    ? 'Update Employee'
                    : 'Add Employee'}
                </button>

              </div>

            </form>
          )}

          {/* EMPLOYEE TABLE */}

          <div className="table-container">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Job Title</th>
                  <th>Organization</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">

                        <h3>
                          No employees found
                        </h3>

                        <p>
                          Employees will appear here.
                        </p>

                      </div>
                    </td>
                  </tr>
                ) : (
                  employees.map(
                    (employee) => (
                      <tr
                        key={employee.employeeId}
                      >

                        <td>
                          {employee.name}
                        </td>

                        <td>
                          {employee.email}
                        </td>

                        <td>
                          {employee.jobTitle}
                        </td>

                        <td>
                          {getOrganizationName(
                            employee.orgId
                          )}
                        </td>

                        <td>

                          <button
                            type="button"
                            className="secondary-button"
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
                            className="secondary-button"
                            onClick={() =>
                              deleteEmployee(
                                employee.employeeId
                              )
                            }
                          >
                            Delete
                          </button>

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

      {/* ================================================= */}
      {/* VENUES */}
      {/* ================================================= */}

      {activeSection === 'venues' && (
        <div className="content-card">

          <div className="section-header">

            <div>
              <h2>Venues</h2>

              <p>
                View and manage event venues.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={openAddVenue}
            >
              + Add Venue
            </button>

          </div>

          {/* VENUE FORM */}

          {showVenueForm && (
            <form
              onSubmit={saveVenue}
              className="content-card"
            >

              <h3>Add Venue</h3>

              <div className="form-grid">

                <div>
                  <label>Address</label>

                  <input
                    type="text"
                    name="address"
                    value={venueForm.address}
                    onChange={handleVenueChange}
                    required
                  />
                </div>

                <div>
                  <label>Capacity</label>

                  <input
                    type="number"
                    name="capacity"
                    value={venueForm.capacity}
                    onChange={handleVenueChange}
                    min="1"
                    required
                  />
                </div>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowVenueForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
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

          <div className="table-container">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Venue</th>
                  <th>Location</th>
                  <th>Capacity</th>
                </tr>
              </thead>

              <tbody>

                {venues.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty-state">

                        <h3>
                          No venues found
                        </h3>

                        <p>
                          Venues will appear here.
                        </p>

                      </div>
                    </td>
                  </tr>
                ) : (
                  venues.map(
                    (venue) => (
                      <tr
                        key={venue.venueId}
                      >

                        <td>
                          {venue.address}
                        </td>

                        <td>
                          {venue.address}
                        </td>

                        <td>
                          {venue.capacity}
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