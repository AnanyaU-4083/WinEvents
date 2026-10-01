import { useEffect, useState } from 'react'

import SearchBar from '../Components/SearchBar'
import EventFilter from '../Components/EventFilter'

interface Attendee {
  attendeeId: number
  name: string
  email: string
  phone: string
  ticket: string
}

interface EventItem {
  eventId: number
  eventName: string
}

interface Participant {
  attendeeId: number
  name: string
  email: string
  eventId: number
  eventName: string
  registeredAt: string
}

const API_URL = '/api'

function Participants() {
  const [selectedEvent, setSelectedEvent] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [participants, setParticipants] = useState<Participant[]>([])
  const [events, setEvents] = useState<EventItem[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Get JWT token if the user is logged in.
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')

    if (!token) {
      return {}
    }

    return {
      Authorization: `Bearer ${token}`,
    }
  }

  // Load events for the event filter.
  const loadEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/events`, {
        headers: {
          ...getAuthHeaders(),
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load events.')
      }

      const data = await response.json()

      setEvents(data)
    } catch (error) {
      console.error(error)
      setError('Unable to load events.')
    }
  }

  // Load all participants.
  const loadParticipants = async () => {
    try {
      setLoading(true)
      setError('')

      const eventsResponse = await fetch(`${API_URL}/events`, {
        headers: {
          ...getAuthHeaders(),
        },
      })

      if (!eventsResponse.ok) {
        throw new Error('Failed to load events.')
      }

      const eventData: EventItem[] = await eventsResponse.json()

      const participantRequests = eventData.map(async (event) => {
        const response = await fetch(
          `${API_URL}/events/${event.eventId}/attendees`,
          {
            headers: {
              ...getAuthHeaders(),
            },
          }
        )

        if (!response.ok) {
          return []
        }

        const attendeeData: Attendee[] = await response.json()

        return attendeeData.map((attendee) => ({
          attendeeId: attendee.attendeeId,
          name: attendee.name,
          email: attendee.email,
          eventId: event.eventId,
          eventName: event.eventName,
          registeredAt: '',
        }))
      })

      const results = await Promise.all(participantRequests)

      const allParticipants = results.flat()

      setParticipants(allParticipants)
    } catch (error) {
      console.error(error)
      setError('Unable to load participants.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
    loadParticipants()
  }, [])

  const filteredParticipants = participants.filter((participant) => {
    const matchesSearch =
      participant.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      participant.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

    const matchesEvent =
      selectedEvent === 'all' ||
      participant.eventId.toString() === selectedEvent

    return matchesSearch && matchesEvent
  })

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

          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <EventFilter
            value={selectedEvent}
            events={events}
            onChange={setSelectedEvent}
          />

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

              {loading ? (

                <tr>
                  <td colSpan={5}>

                    <div className="empty-state">

                      <h3>Loading participants...</h3>

                      <p>
                        Please wait while participants are loaded.
                      </p>

                    </div>

                  </td>
                </tr>

              ) : error ? (

                <tr>
                  <td colSpan={5}>

                    <div className="empty-state">

                      <h3>{error}</h3>

                    </div>

                  </td>
                </tr>

              ) : filteredParticipants.length === 0 ? (

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

              ) : (

                filteredParticipants.map((participant) => (

                  <tr key={`${participant.eventId}-${participant.attendeeId}`}>

                    <td>
                      {participant.name}
                    </td>

                    <td>
                      {participant.email}
                    </td>

                    <td>
                      {participant.eventName}
                    </td>

                    <td>
                      {participant.registeredAt || 'Registered'}
                    </td>

                    <td>
                      {/* Actions will be added here later. */}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}

export default Participants