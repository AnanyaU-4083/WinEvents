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

interface AttendeeForm {
  name: string
  email: string
  phone: string
  ticket: string
  eventId: string
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

  const [attendees, setAttendees] =
    useState<Attendee[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [showAddForm, setShowAddForm] =
    useState(false)

  const [attendeeForm, setAttendeeForm] =
    useState<AttendeeForm>({
      name: '',
      email: '',
      phone: '',
      ticket: '',
      eventId: '',
    })


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
         * Get all attendees.
         *
         * GET /api/attendees
         */
        console.log(
          'Loading attendees...'
        )


        const attendeesResponse =
          await fetch(
            `${API_URL}/attendees`,
            {
              method: 'GET',
              headers,
            }
          )


        if (!attendeesResponse.ok) {

          throw new Error(
            `Failed to load attendees. Status: ${attendeesResponse.status}`
          )
        }


        const attendeeData: Attendee[] =
          await attendeesResponse.json()


        if (cancelled) {
          return
        }


        console.log(
          'Attendees loaded:',
          attendeeData
        )


        setAttendees(attendeeData)


        /*
         * STEP 3
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


          const eventAttendeeData: Attendee[] =
            await response.json()


          console.log(
            `Event ${event.eventId} attendees:`,
            eventAttendeeData
          )


          /*
           * Convert attendee data
           * into Participant data.
           */
          eventAttendeeData.forEach(
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


  /*
   * Open Add Participant form.
   */
  const openAddParticipant = () => {

    setAttendeeForm({
      name: '',
      email: '',
      phone: '',
      ticket: '',
      eventId: '',
    })

    setError('')

    setShowAddForm(true)
  }


  /*
   * Handle Add Participant form changes.
   */
  const handleAttendeeChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {

    const { name, value } =
      event.target

    setAttendeeForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    )
  }


  /*
   * Add a new attendee and
   * register them for an event.
   */
  const addParticipant = async (
    event: React.FormEvent
  ) => {

    event.preventDefault()

    try {

      setLoading(true)
      setError('')


      if (!attendeeForm.eventId) {

        throw new Error(
          'Please select an event.'
        )
      }


      /*
       * Get Microsoft access token.
       */
      const token =
        await getAccessToken()


      const headers = {
        'Content-Type':
          'application/json',

        Authorization:
          `Bearer ${token}`,
      }


      /*
       * STEP 1
       *
       * Create the new attendee.
       *
       * POST /api/attendees
       */
      const attendeeResponse =
        await fetch(
          `${API_URL}/attendees`,
          {
            method: 'POST',
            headers,

            body: JSON.stringify({
              name: attendeeForm.name,
              email: attendeeForm.email,
              phone: attendeeForm.phone,
              ticket: attendeeForm.ticket,
            }),
          }
        )


      if (!attendeeResponse.ok) {

        const message =
          await attendeeResponse.text()

        throw new Error(
          message ||
          `Failed to create attendee. Status: ${attendeeResponse.status}`
        )
      }


      const newAttendee: Attendee =
        await attendeeResponse.json()


      /*
       * STEP 2
       *
       * Register the new attendee
       * for the selected event.
       *
       * POST /api/events/{eventId}/attendees/{attendeeId}
       */
      const registrationResponse =
        await fetch(
          `${API_URL}/events/${attendeeForm.eventId}/attendees/${newAttendee.attendeeId}`,
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        )


      if (!registrationResponse.ok) {

        const message =
          await registrationResponse.text()

        throw new Error(
          message ||
          `Attendee was created, but registration failed. Status: ${registrationResponse.status}`
        )
      }


      /*
       * Find the selected event.
       */
      const selectedEventData =
        events.find(
          (item) =>
            item.eventId.toString() ===
            attendeeForm.eventId
        )


      /*
       * Add the new participant
       * directly to React state.
       */
      if (selectedEventData) {

        setParticipants(
          (previous) => [
            ...previous,
            {
              attendeeId:
                newAttendee.attendeeId,

              name:
                newAttendee.name,

              email:
                newAttendee.email,

              eventId:
                selectedEventData.eventId,

              eventName:
                selectedEventData.eventName,

              registeredAt:
                'Registered',
            },
          ]
        )

      }


      /*
       * Add the attendee to the
       * attendee list as well.
       */
      setAttendees(
        (previous) => [
          ...previous,
          newAttendee,
        ]
      )


      /*
       * Close form.
       */
      setShowAddForm(false)

      setAttendeeForm({
        name: '',
        email: '',
        phone: '',
        ticket: '',
        eventId: '',
      })


    } catch (error) {

      console.error(
        'Error adding participant:',
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to add participant.'
      )

    } finally {

      setLoading(false)

    }

  }


  /*
   * Remove participant from an event.
   *
   * This deletes the registration
   * between the attendee and event.
   */
  const removeParticipant = async (
    eventId: number,
    attendeeId: number
  ) => {

    const confirmed = window.confirm(
      'Are you sure you want to remove this participant from the event?'
    )

    if (!confirmed) {
      return
    }

    try {

      setError('')

      /*
       * Get a fresh Microsoft access token.
       */
      const token =
        await getAccessToken()


      /*
       * DELETE registration.
       *
       * DELETE /api/events/{eventId}/attendees/{attendeeId}
       */
      const response =
        await fetch(
          `${API_URL}/events/${eventId}/attendees/${attendeeId}`,
          {
            method: 'DELETE',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        )


      if (!response.ok) {

        const message =
          await response.text()

        throw new Error(
          message ||
          `Failed to remove participant. Status: ${response.status}`
        )
      }


      /*
       * Remove the participant
       * from the current React state.
       */
      setParticipants(
        (previous) =>
          previous.filter(
            (participant) =>
              !(
                participant.eventId === eventId &&
                participant.attendeeId === attendeeId
              )
          )
      )

    } catch (error) {

      console.error(
        'Error removing participant:',
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to remove participant.'
      )

    }

  }


  /*
   * Tailwind CSS classes.
   *
   
   * classes such as:
   *
   * page
   * page-header
   * content-card
   * card-header
   * form-grid
   * form-actions
   * primary-button
   * secondary-button
   * participant-filters
   * table-container
   * data-table
   * empty-state
   */


  const inputClass =
    'w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20'


  const primaryButtonClass =
    'rounded-lg bg-[#0066ff] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0052cc] disabled:cursor-not-allowed disabled:opacity-50'


  const secondaryButtonClass =
    'rounded-lg border border-[#dfe5ec] bg-white px-4 py-2 text-sm font-medium text-[#374151] transition hover:border-[#0066ff] hover:bg-[#eaf2ff] hover:text-[#0052cc]'


  return (

    <div
      className="
        min-h-full
        bg-[#f5f8fc]
        p-6
        md:p-8
      "
    >

      {/* PAGE HEADER */}

      <div
        className="
          mb-6
          flex
          items-center
          justify-between
          gap-4
        "
      >

        <div>

          <h1
            className="
              text-2xl
              font-bold
              text-[#111827]
            "
          >
            Participants
          </h1>

          <p
            className="
              mt-1
              text-sm
              text-[#6b7280]
            "
          >
            Manage attendees and event
            registrations.
          </p>

        </div>

      </div>


      {/* MAIN CONTENT CARD */}

      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-[#dfe5ec]
          bg-white
          shadow-[0_6px_20px_rgba(15,23,42,0.08)]
        "
      >

        {/* CARD HEADER */}

        <div
          className="
            flex
            flex-col
            items-start
            justify-between
            gap-4
            border-b
            border-[#edf0f4]
            px-6
            py-5
            md:flex-row
            md:items-center
          "
        >

          <div>

            <h2
              className="
                text-lg
                font-semibold
                text-[#111827]
              "
            >
              Participants
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-[#6b7280]
              "
            >
              View attendees and their
              event registrations.
            </p>

          </div>


          <button
            type="button"
            className={primaryButtonClass}
            onClick={openAddParticipant}
          >
            + Add Participant
          </button>

        </div>


        {/* ERROR MESSAGE */}

        {error && !showAddForm && (

          <div
            className="
              mx-6
              mt-6
              rounded-lg
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-700
            "
          >
            {error}
          </div>

        )}


        {/* ADD PARTICIPANT FORM */}

        {showAddForm && (

          <form
            onSubmit={addParticipant}
            className="
              m-6
              rounded-xl
              border
              border-[#dfe5ec]
              bg-[#f8fafc]
              p-6
            "
          >

            <h3
              className="
                mb-5
                text-lg
                font-semibold
                text-[#111827]
              "
            >
              Add Participant
            </h3>


            <div
              className="
                grid
                grid-cols-1
                gap-5
                md:grid-cols-2
              "
            >

              {/* NAME */}

              <div
                className="
                  flex
                  flex-col
                  gap-2
                "
              >

                <label
                  className="
                    text-sm
                    font-medium
                    text-[#374151]
                  "
                >
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={attendeeForm.name}
                  onChange={handleAttendeeChange}
                  className={inputClass}
                  required
                />

              </div>


              {/* EMAIL */}

              <div
                className="
                  flex
                  flex-col
                  gap-2
                "
              >

                <label
                  className="
                    text-sm
                    font-medium
                    text-[#374151]
                  "
                >
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={attendeeForm.email}
                  onChange={handleAttendeeChange}
                  className={inputClass}
                  required
                />

              </div>


              {/* PHONE */}

              <div
                className="
                  flex
                  flex-col
                  gap-2
                "
              >

                <label
                  className="
                    text-sm
                    font-medium
                    text-[#374151]
                  "
                >
                  Phone
                </label>

                <input
                  type="text"
                  name="phone"
                  value={attendeeForm.phone}
                  onChange={handleAttendeeChange}
                  className={inputClass}
                  required
                />

              </div>


              {/* TICKET */}

              <div
                className="
                  flex
                  flex-col
                  gap-2
                "
              >

                <label
                  className="
                    text-sm
                    font-medium
                    text-[#374151]
                  "
                >
                  Ticket
                </label>

                <input
                  type="text"
                  name="ticket"
                  value={attendeeForm.ticket}
                  onChange={handleAttendeeChange}
                  className={inputClass}
                  required
                />

              </div>


              {/* EVENT */}

              <div
                className="
                  flex
                  flex-col
                  gap-2
                "
              >

                <label
                  className="
                    text-sm
                    font-medium
                    text-[#374151]
                  "
                >
                  Event
                </label>

                <select
                  name="eventId"
                  value={attendeeForm.eventId}
                  onChange={handleAttendeeChange}
                  className={inputClass}
                  required
                >

                  <option value="">
                    Select event
                  </option>

                  {events.map(
                    (event) => (

                      <option
                        key={event.eventId}
                        value={event.eventId}
                      >
                        {event.eventName}
                      </option>

                    )
                  )}

                </select>

              </div>

            </div>


            {/* FORM ACTIONS */}

            <div
              className="
                mt-6
                flex
                flex-wrap
                justify-end
                gap-3
              "
            >

              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() =>
                  setShowAddForm(false)
                }
              >
                Cancel
              </button>


              <button
                type="submit"
                className={primaryButtonClass}
                disabled={loading}
              >
                {loading
                  ? 'Adding...'
                  : 'Add Participant'}
              </button>

            </div>

          </form>

        )}


        {/* FILTERS */}

        <div
          className="
            flex
            flex-col
            gap-3
            border-b
            border-[#edf0f4]
            p-6
            md:flex-row
          "
        >

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


        {/* TABLE */}

        <div
          className="
            w-full
            overflow-x-auto
          "
        >

          <table
            className="
              min-w-full
              border-collapse
              text-left
              text-sm
            "
          >

            <thead>

              <tr>

                <th
                  className="
                    whitespace-nowrap
                    bg-[#f5f8fc]
                    px-5
                    py-3
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-[#6b7280]
                  "
                >
                  Attendee
                </th>

                <th
                  className="
                    whitespace-nowrap
                    bg-[#f5f8fc]
                    px-5
                    py-3
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-[#6b7280]
                  "
                >
                  Email
                </th>

                <th
                  className="
                    whitespace-nowrap
                    bg-[#f5f8fc]
                    px-5
                    py-3
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-[#6b7280]
                  "
                >
                  Event
                </th>

                <th
                  className="
                    whitespace-nowrap
                    bg-[#f5f8fc]
                    px-5
                    py-3
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-[#6b7280]
                  "
                >
                  Registration
                </th>

                <th
                  className="
                    whitespace-nowrap
                    bg-[#f5f8fc]
                    px-5
                    py-3
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-[#6b7280]
                  "
                >
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {/* LOADING */}

              {loading ? (

                <tr>

                  <td
                    colSpan={5}
                    className="
                      border-t
                      border-[#edf0f4]
                    "
                  >

                    <div
                      className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        px-6
                        py-12
                        text-center
                      "
                    >

                      <h3
                        className="
                          text-base
                          font-semibold
                          text-[#111827]
                        "
                      >
                        Loading participants...
                      </h3>

                      <p
                        className="
                          mt-2
                          text-sm
                          text-[#6b7280]
                        "
                      >
                        Please wait while
                        participants are loaded.
                      </p>

                    </div>

                  </td>

                </tr>

              ) : error ? (

                /* ERROR */

                <tr>

                  <td
                    colSpan={5}
                    className="
                      border-t
                      border-[#edf0f4]
                    "
                  >

                    <div
                      className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        px-6
                        py-12
                        text-center
                      "
                    >

                      <h3
                        className="
                          text-base
                          font-semibold
                          text-red-600
                        "
                      >
                        {error}
                      </h3>

                    </div>

                  </td>

                </tr>

              ) : filteredParticipants.length === 0 ? (

                /* EMPTY */

                <tr>

                  <td
                    colSpan={5}
                    className="
                      border-t
                      border-[#edf0f4]
                    "
                  >

                    <div
                      className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        px-6
                        py-12
                        text-center
                      "
                    >

                      <h3
                        className="
                          text-base
                          font-semibold
                          text-[#111827]
                        "
                      >
                        No participants found
                      </h3>

                      <p
                        className="
                          mt-2
                          text-sm
                          text-[#6b7280]
                        "
                      >
                        Registered attendees
                        will appear here.
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                /* PARTICIPANTS */

                filteredParticipants.map(
                  (participant) => (

                    <tr
                      key={`${participant.eventId}-${participant.attendeeId}`}
                      className="
                        transition
                        hover:bg-[#f8fafc]
                      "
                    >

                      <td
                        className="
                          border-t
                          border-[#edf0f4]
                          px-5
                          py-4
                          text-sm
                          font-medium
                          text-[#111827]
                        "
                      >
                        {participant.name}
                      </td>


                      <td
                        className="
                          border-t
                          border-[#edf0f4]
                          px-5
                          py-4
                          text-sm
                          text-[#374151]
                        "
                      >
                        {participant.email}
                      </td>


                      <td
                        className="
                          border-t
                          border-[#edf0f4]
                          px-5
                          py-4
                          text-sm
                          text-[#374151]
                        "
                      >
                        {participant.eventName}
                      </td>


                      <td
                        className="
                          border-t
                          border-[#edf0f4]
                          px-5
                          py-4
                          text-sm
                          text-[#6b7280]
                        "
                      >
                        {participant.registeredAt}
                      </td>


                      <td
                        className="
                          border-t
                          border-[#edf0f4]
                          px-5
                          py-4
                        "
                      >

                        <button
                          type="button"
                          className={secondaryButtonClass}
                          onClick={() =>
                            removeParticipant(
                              participant.eventId,
                              participant.attendeeId
                            )
                          }
                        >
                          Remove
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

    </div>

  )
}

export default Participants