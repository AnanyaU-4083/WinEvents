import { useEffect, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import type { AccountInfo } from '@azure/msal-browser'

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

  const { instance, accounts } = useMsal()

  const [selectedEvent, setSelectedEvent] =
    useState('all')

  const [searchTerm, setSearchTerm] =
    useState('')

  const [participants, setParticipants] =
    useState<Participant[]>([])

  const [events, setEvents] =
    useState<EventItem[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')


  /*
   * Get the currently logged-in
   * Microsoft account.
   */
  const account: AccountInfo | undefined =
    instance.getActiveAccount() ?? accounts[0]


  /*
   * Get Microsoft access token.
   */
  const getAccessToken = async () => {

    if (!account) {
      throw new Error(
        'No Microsoft account is logged in.'
      )
    }

    const response =
      await instance.acquireTokenSilent({
        scopes: [
          'api://0332cc25-1dc3-4542-b1cd-a1ad23d0f620/access_as_user'
        ],
        account,
      })

    return response.accessToken
  }


  /*
   * Load events and participants.
   */
  useEffect(() => {

    let cancelled = false

    const loadData = async () => {

      try {

        setLoading(true)
        setError('')


        /*
         * Check Microsoft account.
         */
        if (!account) {

          throw new Error(
            'Please log in with Microsoft first.'
          )
        }


        console.log(
          'Loading participants...'
        )


        /*
         * Get Microsoft access token.
         */
        const token =
          await getAccessToken()


        if (cancelled) {
          return
        }


        console.log(
          'Access token received.'
        )


        const headers = {
          Authorization: `Bearer ${token}`,
        }


        /*
         * STEP 1
         *
         * Get all events.
         *
         * GET /api/events
         */
        console.log(
          'Loading events...'
        )


        const eventsResponse =
          await fetch(
            `${API_URL}/events`,
            {
              method: 'GET',
              headers,
            }
          )


        if (!eventsResponse.ok) {

          throw new Error(
            `Failed to load events. Status: ${eventsResponse.status}`
          )
        }


        const eventData: EventItem[] =
          await eventsResponse.json()


        if (cancelled) {
          return
        }


        console.log(
          'Events loaded:',
          eventData
        )


        setEvents(eventData)


        /*
         * STEP 2
         *
         * Get attendees for every event.
         *
         * We load them one event at a time.
         */
        console.log(
          `Loading attendees for ${eventData.length} events...`
        )


        const allParticipants: Participant[] = []


        for (const event of eventData) {

          if (cancelled) {
            return
          }


          console.log(
            `Loading attendees for event ${event.eventId} - ${event.eventName}`
          )


          const response =
            await fetch(
              `${API_URL}/events/${event.eventId}/attendees`,
              {
                method: 'GET',
                headers,
              }
            )


          /*
           * If this particular event
           * fails, continue with the
           * remaining events.
           */
          if (!response.ok) {

            console.error(
              `Failed to load attendees for event ${event.eventId}. Status: ${response.status}`
            )

            continue
          }


          const attendeeData: Attendee[] =
            await response.json()


          console.log(
            `Event ${event.eventId} attendees:`,
            attendeeData
          )


          /*
           * Convert attendee data
           * into Participant data.
           */
          attendeeData.forEach(
            (attendee) => {

              allParticipants.push({

                attendeeId:
                  attendee.attendeeId,

                name:
                  attendee.name,

                email:
                  attendee.email,

                eventId:
                  event.eventId,

                eventName:
                  event.eventName,

                registeredAt:
                  'Registered',

              })

            }
          )

        }


        if (cancelled) {
          return
        }


        console.log(
          'All participants:',
          allParticipants
        )


        /*
         * Put all participants
         * into React state.
         */
        setParticipants(
          allParticipants
        )


      } catch (error) {

        if (cancelled) {
          return
        }


        console.error(
          'Error loading participants:',
          error
        )


        setError(
          error instanceof Error
            ? error.message
            : 'Unable to load participants.'
        )


      } finally {

        if (!cancelled) {

          setLoading(false)

        }

      }

    }


    loadData()


    /*
     * Cleanup.
     */
    return () => {

      cancelled = true

    }

  }, [account?.homeAccountId])


  /*
   * Search + event filtering.
   */
  const filteredParticipants =
    participants.filter(
      (participant) => {

        const matchesSearch =
          participant.name
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            ) ||

          participant.email
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            )


        const matchesEvent =
          selectedEvent === 'all' ||
          participant.eventId.toString() ===
            selectedEvent


        return (
          matchesSearch &&
          matchesEvent
        )

      }
    )


  return (

    <div className="page">

      <div className="page-header">

        <div>

          <h1>
            Participants
          </h1>

          <p>
            Manage attendees and event
            registrations.
          </p>

        </div>

      </div>


      <div className="content-card">

        <div className="card-header">

          <div>

            <h2>
              Participants
            </h2>

            <p>
              View attendees and their
              event registrations.
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

                <th>
                  Attendee
                </th>

                <th>
                  Email
                </th>

                <th>
                  Event
                </th>

                <th>
                  Registration
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>

                  <td colSpan={5}>

                    <div className="empty-state">

                      <h3>
                        Loading participants...
                      </h3>

                      <p>
                        Please wait while
                        participants are loaded.
                      </p>

                    </div>

                  </td>

                </tr>

              ) : error ? (

                <tr>

                  <td colSpan={5}>

                    <div className="empty-state">

                      <h3>
                        {error}
                      </h3>

                    </div>

                  </td>

                </tr>

              ) : filteredParticipants.length === 0 ? (

                <tr>

                  <td colSpan={5}>

                    <div className="empty-state">

                      <h3>
                        No participants found
                      </h3>

                      <p>
                        Registered attendees
                        will appear here.
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                filteredParticipants.map(
                  (participant) => (

                    <tr
                      key={`${participant.eventId}-${participant.attendeeId}`}
                    >

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
                        {participant.registeredAt}
                      </td>

                      <td>
                        {/* Actions will be added later. */}
                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  )
}

export default Participants