import { FormEvent, useEffect, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import type { AccountInfo } from '@azure/msal-browser'

type EventStatus = 0 | 1 | 2
// 0 = Scheduled
// 1 = Cancelled
// 2 = Completed

type EventType = 0 | 1 | 2 | 3 | 4 | 5
// 0 = Conference
// 1 = Workshop
// 2 = Webinar
// 3 = Cultural Fest
// 4 = Meeting
// 5 = Product Launch

interface EventResponse {
  eventId: number
  eventName: string
  startDate: string
  endDate: string
  budget: number | null
  eventType: EventType
  status: EventStatus
  venueId: number | null
  orgId: number | null
}

interface Venue {
  venueId: number
  address: string
  capacity: number
}

interface Organization {
  orgId: number
  name: string
  email: string
  phone: string
  contactPerson: string
}

interface EventFormData {
  eventName: string
  startDate: string
  endDate: string
  venueId: string
  budget: string
  eventType: string
  orgId: string
}

function Events() {
  const { instance, accounts } = useMsal()

  const account: AccountInfo | undefined =
    instance.getActiveAccount() ?? accounts[0]

  const [events, setEvents] = useState<EventResponse[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])

  const [showCreateForm, setShowCreateForm] = useState(false)

  const [editingEventId, setEditingEventId] =
    useState<number | null>(null)

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState<EventFormData>({
    eventName: '',
    startDate: '',
    endDate: '',
    venueId: '',
    budget: '',
    eventType: '',
    orgId: '',
  })

  // API URL

  const API_URL = '/api'

  // Authorization header

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    if (!account) {
      throw new Error('No Microsoft account is logged in.')
    }

    const response =
      await instance.acquireTokenSilent({
        scopes: [
          'api://0332cc25-1dc3-4542-b1cd-a1ad23d0f620/access_as_user'
        ],
        account,
      })

    return {
      Authorization: `Bearer ${response.accessToken}`,
    }
  }

  // Load all data

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      await Promise.all([
        loadEvents(),
        loadVenues(),
        loadOrganizations(),
      ])
    } catch (error) {
      console.error('Failed to load data:', error)
      setError('Failed to load event data.')
    } finally {
      setLoading(false)
    }
  }

  // GET EVENTS
  // GET /api/events

  const loadEvents = async () => {
    const response = await fetch(`${API_URL}/events`)

    if (!response.ok) {
      throw new Error('Failed to load events.')
    }

    const data: EventResponse[] = await response.json()

    setEvents(data)
  }

  // GET VENUES
  // GET /api/venues

  const loadVenues = async () => {
    const response = await fetch(`${API_URL}/venues`)

    if (!response.ok) {
      throw new Error('Failed to load venues.')
    }

    const data: Venue[] = await response.json()

    setVenues(data)
  }

  // ---------------------------------------------------------
  // GET ORGANIZATIONS
  // GET /api/organizations
  // ---------------------------------------------------------

  const loadOrganizations = async () => {
    const authHeaders = await getAuthHeaders()

    const response = await fetch(`${API_URL}/organizations`, {
      headers: authHeaders,
    })

    if (!response.ok) {
      throw new Error('Failed to load organizations.')
    }

    const data: Organization[] = await response.json()

    setOrganizations(data)
  }

  // ---------------------------------------------------------
  // FORM INPUT CHANGE
  // ---------------------------------------------------------

  const handleInputChange = (
    field: keyof EventFormData,
    value: string,
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  // ---------------------------------------------------------
  // RESET FORM
  // ---------------------------------------------------------

  const resetForm = () => {
    setFormData({
      eventName: '',
      startDate: '',
      endDate: '',
      venueId: '',
      budget: '',
      eventType: '',
      orgId: '',
    })

    setEditingEventId(null)
    setShowCreateForm(false)
  }

  // ---------------------------------------------------------
  // OPEN CREATE FORM
  // ---------------------------------------------------------

  const openCreateForm = () => {
    setError('')
    setSuccessMessage('')

    setEditingEventId(null)

    setFormData({
      eventName: '',
      startDate: '',
      endDate: '',
      venueId: '',
      budget: '',
      eventType: '',
      orgId: '',
    })

    setShowCreateForm(true)
  }

  // ---------------------------------------------------------
  // CONVERT API DATE TO DATETIME-LOCAL
  // ---------------------------------------------------------

  const convertToLocalDateTime = (date: string) => {
    const parsedDate = new Date(date)

    const year = parsedDate.getFullYear()
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
    const day = String(parsedDate.getDate()).padStart(2, '0')
    const hours = String(parsedDate.getHours()).padStart(2, '0')
    const minutes = String(parsedDate.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // ---------------------------------------------------------
  // OPEN EDIT FORM
  // ---------------------------------------------------------

  const openEditForm = (event: EventResponse) => {
    setError('')
    setSuccessMessage('')

    setEditingEventId(event.eventId)

    setFormData({
      eventName: event.eventName,
      startDate: convertToLocalDateTime(event.startDate),
      endDate: convertToLocalDateTime(event.endDate),
      venueId: event.venueId?.toString() ?? '',
      budget: event.budget?.toString() ?? '',
      eventType: event.eventType.toString(),
      orgId: event.orgId?.toString() ?? '',
    })

    setShowCreateForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // ---------------------------------------------------------
  // CREATE EVENT
  // POST /api/events
  // ---------------------------------------------------------

  const createEvent = async () => {
    const request = {
      eventName: formData.eventName,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      venueId: Number(formData.venueId),
      budget:
        formData.budget === ''
          ? null
          : Number(formData.budget),
      eventType: Number(formData.eventType),
      orgId:
        formData.orgId === ''
          ? null
          : Number(formData.orgId),
    }

    const authHeaders = await getAuthHeaders()

    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const message = await response.text()

      throw new Error(
        message || 'Failed to create event.',
      )
    }

    const createdEvent: EventResponse =
      await response.json()

    setEvents((previous) => [
      ...previous,
      createdEvent,
    ])

    setSuccessMessage('Event created successfully.')

    resetForm()
  }

  // ---------------------------------------------------------
  // UPDATE EVENT
  // PUT /api/events/{eventId}
  // ---------------------------------------------------------

  const updateEvent = async () => {
    if (editingEventId === null) {
      return
    }

    const request = {
      eventName: formData.eventName,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      budget:
        formData.budget === ''
          ? null
          : Number(formData.budget),
      eventType: Number(formData.eventType),
      venueId:
        formData.venueId === ''
          ? null
          : Number(formData.venueId),
      orgId:
        formData.orgId === ''
          ? null
          : Number(formData.orgId),
    }

    const authHeaders = await getAuthHeaders()

    const response = await fetch(
      `${API_URL}/events/${editingEventId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(request),
      },
    )

    if (!response.ok) {
      const message = await response.text()

      throw new Error(
        message || 'Failed to update event.',
      )
    }

    setSuccessMessage('Event updated successfully.')

    await loadEvents()

    resetForm()
  }

  // ---------------------------------------------------------
  // FORM SUBMIT
  // ---------------------------------------------------------

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError('')
    setSuccessMessage('')

    if (!formData.eventName.trim()) {
      setError('Event name is required.')
      return
    }

    if (!formData.startDate) {
      setError('Start date is required.')
      return
    }

    if (!formData.endDate) {
      setError('End date is required.')
      return
    }

    if (!formData.venueId) {
      setError('Please select a venue.')
      return
    }

    if (!formData.eventType) {
      setError('Please select an event type.')
      return
    }

    if (
      new Date(formData.endDate) <=
      new Date(formData.startDate)
    ) {
      setError(
        'End date must be after the start date.',
      )
      return
    }

    setSaving(true)

    try {
      if (editingEventId !== null) {
        await updateEvent()
      } else {
        await createEvent()
      }
    } catch (error) {
      console.error('Event save failed:', error)

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to save event.',
      )
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------
  // CANCEL EVENT
  // PATCH /api/events/{eventId}/cancel
  // ---------------------------------------------------------

  const cancelEvent = async (eventId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this event?',
    )

    if (!confirmed) {
      return
    }

    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch(
        `${API_URL}/events/${eventId}/cancel`,
        {
          method: 'PATCH',
          headers: await getAuthHeaders(),
        },
      )

      if (!response.ok) {
        const message = await response.text()

        throw new Error(
          message || 'Failed to cancel event.',
        )
      }

      setSuccessMessage(
        'Event cancelled successfully.',
      )

      await loadEvents()
    } catch (error) {
      console.error('Cancel event failed:', error)

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to cancel event.',
      )
    }
  }

  // ---------------------------------------------------------
  // STATUS TEXT
  // ---------------------------------------------------------

  const getStatusText = (
    status: EventStatus,
  ) => {
    switch (status) {
      case 0:
        return 'Scheduled'

      case 1:
        return 'Cancelled'

      case 2:
        return 'Completed'

      default:
        return 'Unknown'
    }
  }

  // ---------------------------------------------------------
  // EVENT TYPE TEXT
  // ---------------------------------------------------------

  const getEventTypeText = (
    eventType: EventType,
  ) => {
    switch (eventType) {
      case 0:
        return 'Conference'

      case 1:
        return 'Workshop'

      case 2:
        return 'Webinar'

      case 3:
        return 'Cultural Fest'

      case 4:
        return 'Meeting'

      case 5:
        return 'Product Launch'

      default:
        return 'Unknown'
    }
  }

  // ---------------------------------------------------------
  // DATE DISPLAY
  // ---------------------------------------------------------

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  // ---------------------------------------------------------
  // FILTER EVENTS
  // ---------------------------------------------------------

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.eventName
        .toLowerCase()
        .includes(searchText.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      getStatusText(event.status).toLowerCase() ===
        statusFilter

    return matchesSearch && matchesStatus
  })

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div className="min-h-full bg-[#f5f8fc] p-6 md:p-8">

      {/* PAGE HEADER */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">
            Events
          </h1>

          <p className="mt-1 text-sm text-[#6b7280]">
            Create and manage your events.
          </p>
        </div>

        <button
          type="button"
          className="rounded-lg bg-[#0066ff] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0052cc] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            if (showCreateForm) {
              resetForm()
            } else {
              openCreateForm()
            }
          }}
        >
          {showCreateForm
            ? 'Close'
            : '+ Create Event'}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* CREATE / EDIT FORM */}
      {showCreateForm && (
        <div className="mb-6 overflow-hidden rounded-xl border border-[#dfe5ec] bg-white shadow-[0_6px_20px_rgba(15,23,42,0.08)]">

          <div className="border-b border-[#edf0f4] px-6 py-5">
            <h2 className="text-lg font-semibold text-[#111827]">
              {editingEventId !== null
                ? 'Edit Event'
                : 'Create Event'}
            </h2>
          </div>

          <form
            className="space-y-5 p-6"
            onSubmit={handleSubmit}
          >

            {/* EVENT NAME + EVENT TYPE */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-[#374151]"
                  htmlFor="eventName"
                >
                  Event Name
                </label>

                <input
                  className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
                  id="eventName"
                  type="text"
                  placeholder="Enter event name"
                  value={formData.eventName}
                  onChange={(event) =>
                    handleInputChange(
                      'eventName',
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-[#374151]"
                  htmlFor="eventType"
                >
                  Event Type
                </label>

                <select
                  className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
                  id="eventType"
                  value={formData.eventType}
                  onChange={(event) =>
                    handleInputChange(
                      'eventType',
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Select event type
                  </option>

                  <option value="0">
                    Conference
                  </option>

                  <option value="1">
                    Workshop
                  </option>

                  <option value="2">
                    Webinar
                  </option>

                  <option value="3">
                    Cultural Fest
                  </option>

                  <option value="4">
                    Meeting
                  </option>

                  <option value="5">
                    Product Launch
                  </option>
                </select>
              </div>

            </div>

            {/* START + END DATE */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-[#374151]"
                  htmlFor="startDate"
                >
                  Start Date
                </label>

                <input
                  className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(event) =>
                    handleInputChange(
                      'startDate',
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-[#374151]"
                  htmlFor="endDate"
                >
                  End Date
                </label>

                <input
                  className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(event) =>
                    handleInputChange(
                      'endDate',
                      event.target.value,
                    )
                  }
                />
              </div>

            </div>

            {/* VENUE + ORGANIZATION */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-[#374151]"
                  htmlFor="venue"
                >
                  Venue
                </label>

                <select
                  className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
                  id="venue"
                  value={formData.venueId}
                  onChange={(event) =>
                    handleInputChange(
                      'venueId',
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Select venue
                  </option>

                  {venues.map((venue) => (
                    <option
                      key={venue.venueId}
                      value={venue.venueId}
                    >
                      {venue.address} - Capacity:{' '}
                      {venue.capacity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-[#374151]"
                  htmlFor="organization"
                >
                  Organization
                </label>

                <select
                  className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
                  id="organization"
                  value={formData.orgId}
                  onChange={(event) =>
                    handleInputChange(
                      'orgId',
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    No organization
                  </option>

                  {organizations.map(
                    (organization) => (
                      <option
                        key={organization.orgId}
                        value={organization.orgId}
                      >
                        {organization.name}
                      </option>
                    ),
                  )}
                </select>
              </div>

            </div>

            {/* BUDGET */}
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-[#374151]"
                htmlFor="budget"
              >
                Budget
              </label>

              <input
                className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
                id="budget"
                type="number"
                min="0"
                placeholder="Enter budget"
                value={formData.budget}
                onChange={(event) =>
                  handleInputChange(
                    'budget',
                    event.target.value,
                  )
                }
              />
            </div>

            {/* FORM BUTTONS */}
            <div className="flex flex-wrap justify-end gap-3 pt-2">

              <button
                type="button"
                className="rounded-lg border border-[#dfe5ec] bg-white px-4 py-2 text-sm font-medium text-[#374151] transition hover:bg-[#f5f8fc]"
                onClick={resetForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-lg bg-[#0066ff] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0052cc] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingEventId !== null
                    ? 'Update Event'
                    : 'Create Event'}
              </button>

            </div>

          </form>
        </div>
      )}

      {/* EVENTS LIST */}
      <div className="mb-6 w-full overflow-hidden rounded-xl border border-[#dfe5ec] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]">

        <div className="border-b border-[#edf0f4] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">
              All Events
            </h2>

            <p className="mt-1 text-sm text-[#6b7280]">
              View and manage your events.
            </p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col gap-3 border-b border-[#edf0f4] p-6 md:flex-row">

          <input
            className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
            type="text"
            placeholder="Search events..."
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
          />

          <select
            className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
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

        {/* TABLE */}
        <div className="w-full overflow-x-auto">

          <table className="min-w-full border-collapse text-left text-sm">

            <thead>
              <tr>
                <th className="bg-[#f5f8fc] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  Event Name
                </th>

                <th className="bg-[#f5f8fc] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  Type
                </th>

                <th className="bg-[#f5f8fc] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  Start Date
                </th>

                <th className="bg-[#f5f8fc] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  End Date
                </th>

                <th className="bg-[#f5f8fc] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  Status
                </th>

                <th className="bg-[#f5f8fc] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                      <h3>
                        Loading events...
                      </h3>
                    </div>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                      <h3>
                        No events found
                      </h3>

                      <p className="mt-2 text-sm text-[#6b7280]">
                        Create your first event
                        to see it here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.eventId}>

                    <td className="border-t border-[#edf0f4] px-5 py-4 text-sm text-[#374151]">
                      {event.eventName}
                    </td>

                    <td className="border-t border-[#edf0f4] px-5 py-4 text-sm text-[#374151]">
                      {getEventTypeText(
                        event.eventType,
                      )}
                    </td>

                    <td className="border-t border-[#edf0f4] px-5 py-4 text-sm text-[#374151]">
                      {formatDate(
                        event.startDate,
                      )}
                    </td>

                    <td className="border-t border-[#edf0f4] px-5 py-4 text-sm text-[#374151]">
                      {formatDate(
                        event.endDate,
                      )}
                    </td>

                    <td className="border-t border-[#edf0f4] px-5 py-4 text-sm text-[#374151]">
                      {getStatusText(
                        event.status,
                      )}
                    </td>

                    <td className="border-t border-[#edf0f4] px-5 py-4 text-sm text-[#374151]">

                      {event.status !== 1 && (
                        <>
                          <button
                            type="button"
                            className="rounded-lg border border-[#dfe5ec] bg-white px-4 py-2 text-sm font-medium text-[#374151] transition hover:bg-[#f5f8fc]"
                            onClick={() =>
                              openEditForm(event)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="ml-2 rounded-lg border border-[#dfe5ec] bg-white px-4 py-2 text-sm font-medium text-[#374151] transition hover:bg-[#f5f8fc]"
                            onClick={() =>
                              cancelEvent(
                                event.eventId,
                              )
                            }
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {event.status === 1 && (
                        <span>
                          Cancelled
                        </span>
                      )}

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

export default Events