import { useState } from 'react'

type AdminSection =
  | 'organizations'
  | 'employees'
  | 'venues'

function Administration() {
  const [activeSection, setActiveSection] =
    useState<AdminSection>('organizations')

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
            >
              + Add Organization
            </button>

          </div>

          <div className="table-container">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Contact Person</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                <tr>
                  <td colSpan={3}>

                    <div className="empty-state">

                      <h3>No organizations found</h3>

                      <p>
                        Organizations will appear here.
                      </p>

                    </div>

                  </td>
                </tr>

              </tbody>

            </table>

          </div>

        </div>
      )}

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
            >
              + Add Employee
            </button>

          </div>

          <div className="table-container">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                <tr>
                  <td colSpan={3}>

                    <div className="empty-state">

                      <h3>No employees found</h3>

                      <p>
                        Employees will appear here.
                      </p>

                    </div>

                  </td>
                </tr>

              </tbody>

            </table>

          </div>

        </div>
      )}

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
            >
              + Add Venue
            </button>

          </div>

          <div className="table-container">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Venue</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                <tr>
                  <td colSpan={4}>

                    <div className="empty-state">

                      <h3>No venues found</h3>

                      <p>
                        Venues will appear here.
                      </p>

                    </div>

                  </td>
                </tr>

              </tbody>

            </table>

          </div>

        </div>
      )}

    </div>
  )
}

export default Administration