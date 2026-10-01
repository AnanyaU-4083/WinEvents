import { useState } from 'react'

function Participants() {
  const [selectedEvent, setSelectedEvent] = useState('all')

  return (
    <div className="page">

      <div className="page-header">

        <div>
          <h1>Participants</h1>

          <p>
            Manage attendees and event registrations.
          </p>
        </div>

      </div>

      <div className="content-card">

        <div className="card-header">

          <div>
            <h2>Participants</h2>

            <p>
              View attendees and their event registrations.
            </p>
          </div>

        </div>

        <div className="participant-filters">

          <input
            type="text"
            placeholder="Search attendee..."
          />

          <select
            value={selectedEvent}
            onChange={(event) =>
              setSelectedEvent(event.target.value)
            }
          >
            <option value="all">
              All Events
            </option>

            <option value="1">
              Event 1
            </option>

            <option value="2">
              Event 2
            </option>
          </select>

        </div>

        <div className="table-container">

          <table className="data-table">

            <thead>
              <tr>
                <th>Attendee</th>
                <th>Email</th>
                <th>Event</th>
                <th>Registration</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              <tr>
                <td colSpan={5}>

                  <div className="empty-state">

                    <h3>No participants found</h3>

                    <p>
                      Registered attendees will appear here.
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

export default Participants