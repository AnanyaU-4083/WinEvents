import { useState } from 'react'

function Events() {
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <div className="page">

      <div className="page-header">
        <div>
          <h1>Events</h1>
          <p>
            Create and manage your events.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Close' : '+ Create Event'}
        </button>
      </div>

      {showCreateForm && (
        <div className="content-card">
          <div className="card-header">
            <h2>Create Event</h2>
          </div>

          <form className="event-form">

            <div className="form-row">

              <div className="form-group">
                <label htmlFor="eventName">
                  Event Name
                </label>

                <input
                  id="eventName"
                  type="text"
                  placeholder="Enter event name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="eventType">
                  Event Type
                </label>

                <select id="eventType" defaultValue="">
                  <option value="" disabled>
                    Select event type
                  </option>

                  <option value="Conference">
                    Conference
                  </option>

                  <option value="Workshop">
                    Workshop
                  </option>

                  <option value="Webinar">
                    Webinar
                  </option>

                  <option value="Cultural Fest">
                    Cultural Fest
                  </option>

                  <option value="Meeting">
                    Meeting
                  </option>

                  <option value="Product Launch">
                    Product Launch
                  </option>
                </select>
              </div>

            </div>

            <div className="form-row">

              <div className="form-group">
                <label htmlFor="startDate">
                  Start Date
                </label>

                <input
                  id="startDate"
                  type="datetime-local"
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">
                  End Date
                </label>

                <input
                  id="endDate"
                  type="datetime-local"
                />
              </div>

            </div>

            <div className="form-row">

              <div className="form-group">
                <label htmlFor="venue">
                  Venue
                </label>

                <select id="venue" defaultValue="">
                  <option value="" disabled>
                    Select venue
                  </option>

                  <option value="1">
                    Venue 1
                  </option>

                  <option value="2">
                    Venue 2
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="organization">
                  Organization
                </label>

                <select id="organization" defaultValue="">
                  <option value="" disabled>
                    Select organization
                  </option>

                  <option value="1">
                    Organization 1
                  </option>

                  <option value="2">
                    Organization 2
                  </option>
                </select>
              </div>

            </div>

            <div className="form-group">
              <label htmlFor="budget">
                Budget
              </label>

              <input
                id="budget"
                type="number"
                placeholder="Enter budget"
              />
            </div>

            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
              >
                Create Event
              </button>

            </div>

          </form>
        </div>
      )}

      <div className="content-card events-list-card">

        <div className="card-header">
          <div>
            <h2>All Events</h2>
            <p>
              View and manage your events.
            </p>
          </div>
        </div>

        <div className="event-filters">

          <input
            type="text"
            placeholder="Search events..."
          />

          <select defaultValue="all">
            <option value="all">
              All Statuses
            </option>

            <option value="scheduled">
              Scheduled
            </option>

            <option value="cancelled">
              Cancelled
            </option>

            <option value="completed">
              Completed
            </option>
          </select>

        </div>

        <div className="table-container">

          <table className="data-table">

            <thead>
              <tr>
                <th>Event Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <h3>No events found</h3>

                    <p>
                      Create your first event to see it here.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}

export default Events