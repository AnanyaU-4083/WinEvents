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

interface Employee {
  employeeId: number
  name: string
  jobTitle: string | null
  email: string
  orgId: number
}

interface StaffAssignment {
  eventId: number
  eventName: string
  employeeId: number
  name: string
  jobTitle: string
  task: string
  deadline: string | null
  status: string
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

  /*
   * Use a stable account ID instead of the entire
   * MSAL account object in useEffect dependencies.
   */
  const accountId = account?.homeAccountId

  const [events, setEvents] =
    useState<EventResponse[]>([])

  const [venues, setVenues] =
    useState<Venue[]>([])

  const [organizations, setOrganizations] =
    useState<Organization[]>([])

  const [employees, setEmployees] =
    useState<Employee[]>([])

  const [showAssignForm, setShowAssignForm] =
    useState(false)

  const [assigningEvent, setAssigningEvent] =
    useState<EventResponse | null>(null)

  const [assignedStaff, setAssignedStaff] =
    useState<StaffAssignment[]>([])

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState('')

  const [task, setTask] =
    useState('')

  const [deadline, setDeadline] =
    useState('')

  const [assigning, setAssigning] =
    useState(false)

  // ---------------------------------------------------------
  // ATTENDEE REGISTRATION STATE
  // ---------------------------------------------------------

  const [registeredEventIds, setRegisteredEventIds] =
    useState<number[]>([])

  // ---------------------------------------------------------
  // ROLE
  // ---------------------------------------------------------

  const roles =
    (account?.idTokenClaims?.roles as string[]) ?? []

  const isAdmin = roles.includes('Admin')
  const isEmployee = roles.includes('Employee')
  const isAttendee = roles.includes('Attendee')

  const canManageEvents =
    isAdmin || isEmployee

  const [showCreateForm, setShowCreateForm] =
    useState(false)

  const [editingEventId, setEditingEventId] =
    useState<number | null>(null)

  const [searchText, setSearchText] =
    useState('')

  // ---------------------------------------------------------
  // STATUS FILTER
  //
  // Default is Scheduled.
  // ---------------------------------------------------------

  const [statusFilter, setStatusFilter] =
    useState('scheduled')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [registeringEventId, setRegisteringEventId] =
    useState<number | null>(null)

  const [error, setError] =
    useState('')

  const [successMessage, setSuccessMessage] =
    useState('')

  const [formData, setFormData] =
    useState<EventFormData>({
      eventName: '',
      startDate: '',
      endDate: '',
      venueId: '',
      budget: '',
      eventType: '',
      orgId: '',
    })

  // ---------------------------------------------------------
  // API URL
  // ---------------------------------------------------------

  const API_URL = '/api'

  // ---------------------------------------------------------
  // AUTHORIZATION HEADER
  // ---------------------------------------------------------

  const getAuthHeaders =
    async (): Promise<HeadersInit> => {
      if (!account) {
        throw new Error(
          'No Microsoft account is logged in.',
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
        Authorization:
          `Bearer ${response.accessToken}`,
      }
    }

  // ---------------------------------------------------------
  // LOAD ALL DATA
  // ---------------------------------------------------------

  useEffect(() => {
    loadData()
  }, [
    accountId,
    isAttendee,
    canManageEvents,
    statusFilter,
  ])

  const loadData = async () => {
    setLoading(true)
    setError('')

    // -------------------------------------------------------
    // LOAD EVENTS FIRST
    //
    // Events are the main data for this page.
    // Other requests should not prevent events from loading.
    // -------------------------------------------------------

    try {
      await loadEvents()
    } catch (error) {
      console.error(
        'Failed to load events:',
        error,
      )

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load events.',
      )
    }

    // -------------------------------------------------------
    // LOAD VENUES
    // -------------------------------------------------------

    try {
      await loadVenues()
    } catch (error) {
      console.error(
        'Failed to load venues:',
        error,
      )
    }

    // -------------------------------------------------------
    // LOAD ORGANIZATIONS
    // -------------------------------------------------------

    try {
      await loadOrganizations()
    } catch (error) {
      console.error(
        'Failed to load organizations:',
        error,
      )
    }

    // -------------------------------------------------------
    // LOAD EMPLOYEES
    // -------------------------------------------------------

    if (canManageEvents) {
      try {
        await loadEmployees()
      } catch (error) {
        console.error(
          'Failed to load employees:',
          error,
        )
      }
    }

    // -------------------------------------------------------
    // LOAD ATTENDEE REGISTRATIONS
    // -------------------------------------------------------

    if (isAttendee) {
      try {
        await loadMyRegistrations()
      } catch (error) {
        console.error(
          'Failed to load registrations:',
          error,
        )
      }
    }

    setLoading(false)
  }

  // ---------------------------------------------------------
  // GET EVENTS
  //
  // Scheduled:
  // GET /api/events?upcomingOnly=true
  //
  // Past:
  // GET /api/events?upcomingOnly=false
  //
  // All:
  // GET /api/events
  //
  // Cancelled:
  // GET /api/events
  // Then frontend filters cancelled events.
  // ---------------------------------------------------------

  const loadEvents = async () => {
    let url =
      `${API_URL}/events`

    if (statusFilter === 'scheduled') {
      url =
        `${API_URL}/events?upcomingOnly=true`
    } else if (
      statusFilter === 'completed'
    ) {
      url =
        `${API_URL}/events?upcomingOnly=false`
    }

    const response =
      await fetch(url)

    if (!response.ok) {
      throw new Error(
        `Failed to load events. Status: ${response.status}`,
      )
    }

    const data: EventResponse[] =
      await response.json()

    setEvents(data)
  }

  // ---------------------------------------------------------
  // GET MY REGISTERED EVENTS
  // GET /api/events/my-registrations
  // ---------------------------------------------------------

  const loadMyRegistrations =
    async () => {
      const authHeaders =
        await getAuthHeaders()

      const response =
        await fetch(
          `${API_URL}/events/my-registrations`,
          {
            headers: authHeaders,
          },
        )

      if (!response.ok) {
        const message =
          await response.text()

        throw new Error(
          message ||
            'Failed to load registered events.',
        )
      }

      const data: EventResponse[] =
        await response.json()

      setRegisteredEventIds(
        data.map(
          (event) => event.eventId,
        ),
      )
    }

  // ---------------------------------------------------------
  // GET VENUES
  // GET /api/venues
  // ---------------------------------------------------------

  const loadVenues = async () => {
    const response =
      await fetch(
        `${API_URL}/venues`,
      )

    if (!response.ok) {
      throw new Error(
        'Failed to load venues.',
      )
    }

    const data: Venue[] =
      await response.json()

    setVenues(data)
  }

  // ---------------------------------------------------------
  // GET ORGANIZATIONS
  // GET /api/organizations
  // ---------------------------------------------------------

  const loadOrganizations = async () => {
    /*
     * Organizations require authentication.
     *
     * Only Admin/Employee need this data because
     * only they can create/edit events.
     */

    if (!canManageEvents) {
      setOrganizations([])
      return
    }

    const authHeaders =
      await getAuthHeaders()

    const response =
      await fetch(
        `${API_URL}/organizations`,
        {
          headers: authHeaders,
        },
      )

    if (!response.ok) {
      throw new Error(
        'Failed to load organizations.',
      )
    }

    const data: Organization[] =
      await response.json()

    setOrganizations(data)
  }

  // ---------------------------------------------------------
  // GET EMPLOYEES
  // GET /api/employees
  // ---------------------------------------------------------

  const loadEmployees = async () => {
    if (!canManageEvents) {
      setEmployees([])
      return
    }

    const authHeaders =
      await getAuthHeaders()

    const response =
      await fetch(
        `${API_URL}/employees`,
        {
          headers: authHeaders,
        },
      )

    if (!response.ok) {
      throw new Error(
        'Failed to load employees.',
      )
    }

    const data: Employee[] =
      await response.json()

    setEmployees(data)
  }

  // ---------------------------------------------------------
  // REGISTER FOR EVENT
  // POST /api/events/{eventId}/register
  // ---------------------------------------------------------

  const registerForEvent =
    async (
      eventId: number,
    ) => {
      setError('')
      setSuccessMessage('')
      setRegisteringEventId(eventId)

      try {
        const authHeaders =
          await getAuthHeaders()

        const response =
          await fetch(
            `${API_URL}/events/${eventId}/register`,
            {
              method: 'POST',
              headers: authHeaders,
            },
          )

        if (!response.ok) {
          const message =
            await response.text()

          throw new Error(
            message ||
              'Failed to register for event.',
          )
        }

        setRegisteredEventIds(
          (previous) => [
            ...previous,
            eventId,
          ],
        )

        setSuccessMessage(
          'You have successfully registered for the event.',
        )
      } catch (error) {
        console.error(
          'Event registration failed:',
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : 'Failed to register for event.',
        )
      } finally {
        setRegisteringEventId(null)
      }
    }

  // ---------------------------------------------------------
  // CHECK WHETHER EVENT IS REGISTERED
  // ---------------------------------------------------------

  const isEventRegistered =
    (eventId: number) => {
      return registeredEventIds.includes(
        eventId,
      )
    }

  // ---------------------------------------------------------
  // FORM INPUT CHANGE
  // ---------------------------------------------------------

  const handleInputChange =
    (
      field: keyof EventFormData,
      value: string,
    ) => {
      setFormData(
        (previous) => ({
          ...previous,
          [field]: value,
        }),
      )
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

  const convertToLocalDateTime =
    (date: string) => {
      const parsedDate =
        new Date(date)

      const year =
        parsedDate.getFullYear()

      const month =
        String(
          parsedDate.getMonth() + 1,
        ).padStart(2, '0')

      const day =
        String(
          parsedDate.getDate(),
        ).padStart(2, '0')

      const hours =
        String(
          parsedDate.getHours(),
        ).padStart(2, '0')

      const minutes =
        String(
          parsedDate.getMinutes(),
        ).padStart(2, '0')

      return `${year}-${month}-${day}T${hours}:${minutes}`
    }

  // ---------------------------------------------------------
  // OPEN EDIT FORM
  // ---------------------------------------------------------

  const openEditForm =
    (event: EventResponse) => {
      setError('')
      setSuccessMessage('')

      setEditingEventId(
        event.eventId,
      )

      setFormData({
        eventName:
          event.eventName,

        startDate:
          convertToLocalDateTime(
            event.startDate,
          ),

        endDate:
          convertToLocalDateTime(
            event.endDate,
          ),

        venueId:
          event.venueId?.toString() ??
          '',

        budget:
          event.budget?.toString() ??
          '',

        eventType:
          event.eventType.toString(),

        orgId:
          event.orgId?.toString() ??
          '',
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

  const createEvent =
    async () => {
      const request = {
        eventName:
          formData.eventName,

        startDate:
          new Date(
            formData.startDate,
          ).toISOString(),

        endDate:
          new Date(
            formData.endDate,
          ).toISOString(),

        venueId:
          Number(
            formData.venueId,
          ),

        budget:
          formData.budget === ''
            ? null
            : Number(
                formData.budget,
              ),

        eventType:
          Number(
            formData.eventType,
          ),

        orgId:
          formData.orgId === ''
            ? null
            : Number(
                formData.orgId,
              ),
      }

      const authHeaders =
        await getAuthHeaders()

      const response =
        await fetch(
          `${API_URL}/events`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
              ...authHeaders,
            },
            body: JSON.stringify(
              request,
            ),
          },
        )

      if (!response.ok) {
        const message =
          await response.text()

        throw new Error(
          message ||
            'Failed to create event.',
        )
      }

      const createdEvent:
        EventResponse =
        await response.json()

      setEvents(
        (previous) => [
          ...previous,
          createdEvent,
        ],
      )

      setSuccessMessage(
        'Event created successfully.',
      )

      resetForm()
    }

  // ---------------------------------------------------------
  // UPDATE EVENT
  // PUT /api/events/{eventId}
  // ---------------------------------------------------------

  const updateEvent =
    async () => {
      if (
        editingEventId === null
      ) {
        return
      }

      const request = {
        eventName:
          formData.eventName,

        startDate:
          new Date(
            formData.startDate,
          ).toISOString(),

        endDate:
          new Date(
            formData.endDate,
          ).toISOString(),

        budget:
          formData.budget === ''
            ? null
            : Number(
                formData.budget,
              ),

        eventType:
          Number(
            formData.eventType,
          ),

        venueId:
          formData.venueId === ''
            ? null
            : Number(
                formData.venueId,
              ),

        orgId:
          formData.orgId === ''
            ? null
            : Number(
                formData.orgId,
              ),
      }

      const authHeaders =
        await getAuthHeaders()

      const response =
        await fetch(
          `${API_URL}/events/${editingEventId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type':
                'application/json',
              ...authHeaders,
            },
            body: JSON.stringify(
              request,
            ),
          },
        )

      if (!response.ok) {
        const message =
          await response.text()

        throw new Error(
          message ||
            'Failed to update event.',
        )
      }

      setSuccessMessage(
        'Event updated successfully.',
      )

      await loadEvents()

      resetForm()
    }

  // ---------------------------------------------------------
  // FORM SUBMIT
  // ---------------------------------------------------------

  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      setError('')
      setSuccessMessage('')

      if (
        !formData.eventName.trim()
      ) {
        setError(
          'Event name is required.',
        )
        return
      }

      if (!formData.startDate) {
        setError(
          'Start date is required.',
        )
        return
      }

      if (!formData.endDate) {
        setError(
          'End date is required.',
        )
        return
      }

      if (!formData.venueId) {
        setError(
          'Please select a venue.',
        )
        return
      }

      if (!formData.eventType) {
        setError(
          'Please select an event type.',
        )
        return
      }

      if (
        new Date(
          formData.endDate,
        ) <=
        new Date(
          formData.startDate,
        )
      ) {
        setError(
          'End date must be after the start date.',
        )
        return
      }

      setSaving(true)

      try {
        if (
          editingEventId !== null
        ) {
          await updateEvent()
        } else {
          await createEvent()
        }
      } catch (error) {
        console.error(
          'Event save failed:',
          error,
        )

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

  const cancelEvent =
    async (
      eventId: number,
    ) => {
      const confirmed =
        window.confirm(
          'Are you sure you want to cancel this event?',
        )

      if (!confirmed) {
        return
      }

      setError('')
      setSuccessMessage('')

      try {
        const response =
          await fetch(
            `${API_URL}/events/${eventId}/cancel`,
            {
              method: 'PATCH',
              headers:
                await getAuthHeaders(),
            },
          )

        if (!response.ok) {
          const message =
            await response.text()

          throw new Error(
            message ||
              'Failed to cancel event.',
          )
        }

        setSuccessMessage(
          'Event cancelled successfully.',
        )

        await loadEvents()
      } catch (error) {
        console.error(
          'Cancel event failed:',
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : 'Failed to cancel event.',
        )
      }
    }

  // ---------------------------------------------------------
  // LOAD ASSIGNED EMPLOYEES FOR EVENT
  // GET /api/events/{eventId}/staff
  // ---------------------------------------------------------

  const loadAssignedStaff = async (
    eventId: number,
  ) => {
    const authHeaders =
      await getAuthHeaders()

    const response =
      await fetch(
        `${API_URL}/events/${eventId}/staff`,
        {
          headers: authHeaders,
        },
      )

    if (!response.ok) {
      const message =
        await response.text()

      throw new Error(
        message ||
          'Failed to load assigned employees.',
      )
    }

    const data: StaffAssignment[] =
      await response.json()

    setAssignedStaff(data)
  }

  // ---------------------------------------------------------
  // OPEN ASSIGN TASK FORM
  // ---------------------------------------------------------

  const openAssignForm = async (
    event: EventResponse,
  ) => {
    setError('')
    setSuccessMessage('')

    setAssigningEvent(event)
    setSelectedEmployeeId('')
    setTask('')
    setDeadline('')
    setAssignedStaff([])
    setShowAssignForm(true)

    try {
      await loadAssignedStaff(event.eventId)
    } catch (error) {
      console.error(
        'Failed to load assigned employees:',
        error,
      )

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load assigned employees.',
      )
    }
  }

  // ---------------------------------------------------------
  // CLOSE ASSIGN TASK FORM
  // ---------------------------------------------------------

  const closeAssignForm = () => {
    setShowAssignForm(false)
    setAssigningEvent(null)
    setAssignedStaff([])
    setSelectedEmployeeId('')
    setTask('')
    setDeadline('')
  }

  // ---------------------------------------------------------
  // ASSIGN EMPLOYEE TASK
  // POST /api/events/{eventId}/staff
  // ---------------------------------------------------------

  const assignEmployeeTask = async () => {
    if (!assigningEvent) {
      return
    }

    if (!selectedEmployeeId) {
      setError('Please select an employee.')
      return
    }

    if (!task.trim()) {
      setError('Task is required.')
      return
    }

    setAssigning(true)
    setError('')
    setSuccessMessage('')

    try {
      const authHeaders =
        await getAuthHeaders()

      const request = {
        employeeId: Number(
          selectedEmployeeId,
        ),
        task: task.trim(),
        deadline: deadline
          ? new Date(
              deadline,
            ).toISOString()
          : null,
      }

      const response =
        await fetch(
          `${API_URL}/events/${assigningEvent.eventId}/staff`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
              ...authHeaders,
            },
            body: JSON.stringify(
              request,
            ),
          },
        )

      if (!response.ok) {
        const message =
          await response.text()

        throw new Error(
          message ||
            'Failed to assign employee task.',
        )
      }

      setSuccessMessage(
        'Employee task assigned successfully.',
      )

      setSelectedEmployeeId('')
      setTask('')
      setDeadline('')

      await loadAssignedStaff(
        assigningEvent.eventId,
      )
    } catch (error) {
      console.error(
        'Assign employee task failed:',
        error,
      )

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to assign employee task.',
      )
    } finally {
      setAssigning(false)
    }
  }

  // ---------------------------------------------------------
  // STATUS TEXT
  // ---------------------------------------------------------

  const getStatusText =
    (status: EventStatus) => {
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

  const getEventTypeText =
    (eventType: EventType) => {
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

  const formatDate =
    (date: string) => {
      return new Date(
        date,
      ).toLocaleString()
    }

  // ---------------------------------------------------------
  // STATUS SORT ORDER
  // ---------------------------------------------------------

  const getStatusSortOrder =
    (status: EventStatus) => {
      switch (status) {
        case 0:
          return 0

        case 2:
          return 1

        case 1:
          return 2

        default:
          return 3
      }
    }

  // ---------------------------------------------------------
  // FILTER EVENTS
  // ---------------------------------------------------------

  const filteredEvents =
    events
      .filter((event) => {
        const matchesSearch =
          event.eventName
            .toLowerCase()
            .includes(
              searchText.toLowerCase(),
            )

        const matchesStatus =
          statusFilter === 'all' ||
          (
            statusFilter ===
            'scheduled' &&
            event.status === 0
          ) ||
          (
            statusFilter ===
            'completed' &&
            event.status === 2
          ) ||
          (
            statusFilter ===
            'cancelled' &&
            event.status === 1
          )

        return (
          matchesSearch &&
          matchesStatus
        )
      })
      .sort(
        (
          firstEvent,
          secondEvent,
        ) => {
          const statusDifference =
            getStatusSortOrder(
              firstEvent.status,
            ) -
            getStatusSortOrder(
              secondEvent.status,
            )

          if (
            statusDifference !== 0
          ) {
            return statusDifference
          }

          return (
            new Date(
              firstEvent.startDate,
            ).getTime() -
            new Date(
              secondEvent.startDate,
            ).getTime()
          )
        },
      )

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
            {canManageEvents
              ? 'Create and manage your events.'
              : 'View and register for events.'}
          </p>
        </div>

        {/* ONLY ADMIN / EMPLOYEE CAN CREATE */}

        {canManageEvents && (
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
        )}

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

      {showCreateForm &&
        canManageEvents && (
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
                    value={
                      formData.eventName
                    }
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
                    value={
                      formData.eventType
                    }
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
                    value={
                      formData.startDate
                    }
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
                    value={
                      formData.endDate
                    }
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
                    value={
                      formData.venueId
                    }
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

                    {venues.map(
                      (venue) => (
                        <option
                          key={
                            venue.venueId
                          }
                          value={
                            venue.venueId
                          }
                        >
                          {venue.address} -
                          Capacity:{' '}
                          {
                            venue.capacity
                          }
                        </option>
                      ),
                    )}
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
                    value={
                      formData.orgId
                    }
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
                      (
                        organization,
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
                  value={
                    formData.budget
                  }
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
                    : editingEventId !==
                        null
                      ? 'Update Event'
                      : 'Create Event'}
                </button>

              </div>

            </form>

          </div>
        )}

      {/* ASSIGN EMPLOYEE TASK FORM */}

      {showAssignForm &&
        assigningEvent &&
        canManageEvents && (
          <div className="mb-6 overflow-hidden rounded-xl border border-[#dfe5ec] bg-white shadow-[0_6px_20px_rgba(15,23,42,0.08)]">

            <div className="flex items-center justify-between border-b border-[#edf0f4] px-6 py-5">

              <div>
                <h2 className="text-lg font-semibold text-[#111827]">
                  Assign Employee Task
                </h2>

                <p className="mt-1 text-sm text-[#6b7280]">
                  Event: {assigningEvent.eventName}
                </p>
              </div>

              <button
                type="button"
                className="rounded-lg border border-[#dfe5ec] bg-white px-4 py-2 text-sm font-medium text-[#374151] transition hover:bg-[#f5f8fc]"
                onClick={closeAssignForm}
              >
                Close
              </button>

            </div>

            <div className="space-y-5 p-6">

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-[#374151]"
                    htmlFor="assignedEmployee"
                  >
                    Employee
                  </label>

                  <select
                    id="assignedEmployee"
                    className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
                    value={selectedEmployeeId}
                    onChange={(event) =>
                      setSelectedEmployeeId(
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      Select employee
                    </option>

                    {employees.map(
                      (employee) => (
                        <option
                          key={employee.employeeId}
                          value={employee.employeeId}
                        >
                          {employee.name}
                          {employee.jobTitle
                            ? ` - ${employee.jobTitle}`
                            : ''}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-[#374151]"
                    htmlFor="taskDeadline"
                  >
                    Deadline
                  </label>

                  <input
                    id="taskDeadline"
                    type="datetime-local"
                    className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
                    value={deadline}
                    onChange={(event) =>
                      setDeadline(
                        event.target.value,
                      )
                    }
                  />
                </div>

              </div>

              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-[#374151]"
                  htmlFor="employeeTask"
                >
                  Task
                </label>

                <textarea
                  id="employeeTask"
                  rows={3}
                  placeholder="Enter the task assigned to this employee"
                  className="w-full resize-none rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
                  value={task}
                  onChange={(event) =>
                    setTask(event.target.value)
                  }
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-lg bg-[#0066ff] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0052cc] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={assigning}
                  onClick={assignEmployeeTask}
                >
                  {assigning
                    ? 'Assigning...'
                    : 'Assign Task'}
                </button>
              </div>

              <div className="border-t border-[#edf0f4] pt-5">
                <h3 className="mb-4 text-base font-semibold text-[#111827]">
                  Assigned Employees
                </h3>

                {assignedStaff.length === 0 ? (
                  <p className="text-sm text-[#6b7280]">
                    No employees have been assigned to this event yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-[#dfe5ec]">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="bg-[#f5f8fc]">
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                            Employee
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                            Task
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                            Deadline
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {assignedStaff.map(
                          (assignment) => (
                            <tr
                              key={`${assignment.eventId}-${assignment.employeeId}`}
                              className="border-t border-[#edf0f4]"
                            >
                              <td className="px-4 py-3">
                                <p className="font-medium text-[#111827]">
                                  {assignment.name}
                                </p>
                                <p className="text-xs text-[#6b7280]">
                                  {assignment.jobTitle}
                                </p>
                              </td>

                              <td className="px-4 py-3 text-[#374151]">
                                {assignment.task}
                              </td>

                              <td className="px-4 py-3 text-[#374151]">
                                {assignment.deadline
                                  ? new Date(
                                      assignment.deadline,
                                    ).toLocaleString()
                                  : 'No deadline'}
                              </td>

                              <td className="px-4 py-3">
                                <span className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                  {assignment.status}
                                </span>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      {/* EVENTS LIST */}

      <div className="mb-6 w-full overflow-hidden rounded-xl border border-[#dfe5ec] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]">

        <div className="border-b border-[#edf0f4] px-6 py-5">

          <div>

            <h2 className="text-lg font-semibold text-[#111827]">
              Events
            </h2>

            <p className="mt-1 text-sm text-[#6b7280]">
              {canManageEvents
                ? 'View and manage your events.'
                : 'View available events and register for the ones you want to attend.'}
            </p>

          </div>

        </div>

        {/* FILTERS */}

        <div className="flex flex-col gap-3 border-b border-[#edf0f4] p-6 md:flex-row">

          {/* SEARCH */}

          <input
            className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
            type="text"
            placeholder="Search events..."
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value,
              )
            }
          />

          {/* STATUS FILTER */}

          <select
            className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value,
              )
            }
          >
            <option value="scheduled">
              Scheduled Events
            </option>

            <option value="all">
              All Statuses
            </option>

            <option value="completed">
              Past Events
            </option>

            <option value="cancelled">
              Cancelled Events
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
                        {statusFilter ===
                        'scheduled'
                          ? 'There are no scheduled events.'
                          : statusFilter ===
                              'completed'
                            ? 'There are no past events.'
                            : statusFilter ===
                                'cancelled'
                              ? 'There are no cancelled events.'
                              : canManageEvents
                                ? 'Create your first event to see it here.'
                                : 'There are no events matching your search.'}
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                filteredEvents.map(
                  (event) => {

                    const registered =
                      isEventRegistered(
                        event.eventId,
                      )

                    return (
                      <tr
                        key={
                          event.eventId
                        }
                      >

                        <td className="border-t border-[#edf0f4] px-5 py-4 text-sm text-[#374151]">
                          {
                            event.eventName
                          }
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

                          {event.status ===
                            0 && (
                            <span className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                              Scheduled
                            </span>
                          )}

                          {event.status ===
                            1 && (
                            <span className="inline-flex rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                              Cancelled
                            </span>
                          )}

                          {event.status ===
                            2 && (
                            <span className="inline-flex rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                              Completed
                            </span>
                          )}

                        </td>

                        <td className="border-t border-[#edf0f4] px-5 py-4 text-sm text-[#374151]">

                          {/* ADMIN / EMPLOYEE */}

                          {canManageEvents && (
                            <>
                              {event.status !==
                                1 &&
                                event.status !==
                                  2 && (
                                  <>
                                    <button
                                      type="button"
                                      className="rounded-lg bg-[#0066ff] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0052cc]"
                                      onClick={() =>
                                        openAssignForm(
                                          event,
                                        )
                                      }
                                    >
                                      Assign Task
                                    </button>

                                    <button
                                      type="button"
                                      className="ml-2 rounded-lg border border-[#dfe5ec] bg-white px-4 py-2 text-sm font-medium text-[#374151] transition hover:bg-[#f5f8fc]"
                                      onClick={() =>
                                        openEditForm(
                                          event,
                                        )
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

                              {event.status ===
                                1 && (
                                <span className="text-sm text-[#6b7280]">
                                  Cancelled
                                </span>
                              )}

                              {event.status ===
                                2 && (
                                <span className="text-sm text-[#6b7280]">
                                  Completed
                                </span>
                              )}
                            </>
                          )}

                          {/* ATTENDEE */}

                          {isAttendee && (
                            <>
                              {registered ? (
                                <span className="inline-flex rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                                  Registered
                                </span>
                              ) : event.status ===
                                0 ? (
                                <button
                                  type="button"
                                  className="rounded-lg bg-[#0066ff] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0052cc] disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={
                                    registeringEventId ===
                                    event.eventId
                                  }
                                  onClick={() =>
                                    registerForEvent(
                                      event.eventId,
                                    )
                                  }
                                >
                                  {registeringEventId ===
                                  event.eventId
                                    ? 'Registering...'
                                    : 'Register'}
                                </button>
                              ) : (
                                <span className="text-sm text-[#6b7280]">
                                  Not available
                                </span>
                              )}
                            </>
                          )}

                        </td>

                      </tr>
                    )
                  },
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}

export default Events