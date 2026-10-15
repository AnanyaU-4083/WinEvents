import { FormEvent, useEffect, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import type { AccountInfo } from '@azure/msal-browser'
import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import PageHeader from '../Components/PageHeader'
import EventTaskAssignmentPanel from '../Components/EventTaskAssignmentPanel'
import EventEditorForm from '../Components/EventEditorForm'
import EventListPanel from '../Components/EventListPanel'

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
  isRegistrationCancelled?: boolean
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
  assignmentId: number
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
  const navigate = useNavigate()
  const { eventId: routeEventId } = useParams<{ eventId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

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
  const [cancelledRegistrationEventIds, setCancelledRegistrationEventIds] =
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
        data.filter((event) => !event.isRegistrationCancelled).map((event) => event.eventId),
      )
      setCancelledRegistrationEventIds(
        data.filter((event) => event.isRegistrationCancelled).map((event) => event.eventId),
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
            ...previous.filter((id) => id !== eventId),
            eventId,
          ],
        )
        setCancelledRegistrationEventIds((previous) => previous.filter((id) => id !== eventId))

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

  const cancelRegistration = async (eventId: number) => {
    setError('')
    setSuccessMessage('')
    setRegisteringEventId(eventId)

    try {
      const response = await fetch(`${API_URL}/events/${eventId}/register`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to cancel your registration.')
      }

      setRegisteredEventIds((previous) => previous.filter((id) => id !== eventId))
      setCancelledRegistrationEventIds((previous) => [...new Set([...previous, eventId])])
      setSuccessMessage('Your event registration has been cancelled.')
    } catch (error) {
      console.error('Registration cancellation failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to cancel your registration.')
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

  const isRegistrationCancelled = (eventId: number) =>
    cancelledRegistrationEventIds.includes(eventId)

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

    if (routeEventId) {
      navigate('/events', { replace: true })
    }
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

  // OPEN CREATE FORM WHEN NAVIGATING FROM DASHBOARD

useEffect(() => {
  if (searchParams.get('create') !== 'true') {
    return
  }

  // Wait until the logged-in account is available.
  if (!account) {
    return
  }

  // Only Admin and Employee can create events.
  if (!canManageEvents) {
    setSearchParams({}, { replace: true })
    return
  }

  const selectedDate = searchParams.get('date')

  // Use the selected Dashboard date, if provided.
  const validDate =
    selectedDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
      ? selectedDate
      : ''

  setError('')
  setSuccessMessage('')
  setEditingEventId(null)

  setFormData({
    eventName: '',
    startDate: validDate ? `${validDate}T09:00` : '',
    endDate: validDate ? `${validDate}T10:00` : '',
    venueId: '',
    budget: '',
    eventType: '',
    orgId: '',
  })

  setShowCreateForm(true)

  // Remove the query parameters so refreshing won't reopen the form.
  setSearchParams({}, { replace: true })

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}, [
  searchParams,
  setSearchParams,
  accountId,
  canManageEvents,
])

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
  // OPEN AN EVENT FROM /events/:eventId
  // Fetch the selected event and open it in the existing edit form.
  // ---------------------------------------------------------

  useEffect(() => {
    if (!routeEventId || !account || !canManageEvents) {
      return
    }

    const selectedEventId = Number(routeEventId)

    if (!Number.isInteger(selectedEventId) || selectedEventId <= 0) {
      setError('Invalid event ID.')
      return
    }

    let cancelled = false

    const loadEventForEditing = async () => {
      try {
        setError('')
        setSuccessMessage('')

        const response = await fetch(
          `${API_URL}/events/${selectedEventId}`,
          {
            headers: await getAuthHeaders(),
          },
        )

        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || 'Failed to load event details.')
        }

        const event: EventResponse = await response.json()

        if (!cancelled) {
          openEditForm(event)
        }
      } catch (error) {
        console.error('Failed to open event for editing:', error)

        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : 'Failed to load event details.',
          )
        }
      }
    }

    void loadEventForEditing()

    return () => {
      cancelled = true
    }
  }, [routeEventId, accountId, canManageEvents, instance])

  // ---------------------------------------------------------
  // CREATE EVENT
  // POST /api/events
  // ---------------------------------------------------------

  const createEvent =
    async () => {
      console.log('Time entered in form:', {
  startDate: formData.startDate,
  endDate: formData.endDate,
})

console.log('Browser timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone)

console.log('Converted to UTC:', {
  startDate: new Date(formData.startDate).toISOString(),
  endDate: new Date(formData.endDate).toISOString(),
})
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

        console.log('Created event returned by API:', createdEvent)

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

      if (saving) {
        return
      }

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

  const formatDate = (date: string) => {
  const parsedDate = new Date(date)

  console.log('API date:', date)
  console.log('Browser timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone)
  console.log('Local date:', parsedDate.toString())
  console.log('Displayed date:', parsedDate.toLocaleString())

  return parsedDate.toLocaleString()
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
      <PageHeader
        title="Events"
        description={
          canManageEvents
            ? 'Create and manage your events.'
            : 'View and register for events.'
        }
        action={canManageEvents && (
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
      />

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
      {showCreateForm && canManageEvents && (
        <EventEditorForm
          formData={formData}
          venues={venues}
          organizations={organizations}
          isEditing={editingEventId !== null}
          saving={saving}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />
      )}

      {/* ASSIGN EMPLOYEE TASK FORM */}
      {showAssignForm && assigningEvent && canManageEvents && (
        <EventTaskAssignmentPanel
          eventName={assigningEvent.eventName}
          employees={employees}
          assignedStaff={assignedStaff}
          selectedEmployeeId={selectedEmployeeId}
          setSelectedEmployeeId={setSelectedEmployeeId}
          task={task}
          setTask={setTask}
          deadline={deadline}
          setDeadline={setDeadline}
          assigning={assigning}
          onAssign={assignEmployeeTask}
          onClose={closeAssignForm}
        />
      )}

      {/* EVENTS LIST */}
      <EventListPanel
        events={filteredEvents}
        loading={loading}
        searchValue={searchText}
        statusFilter={statusFilter}
        canManageEvents={canManageEvents}
        isAttendee={isAttendee}
        registeringEventId={registeringEventId}
        cancellingRegistrationEventId={registeringEventId}
        onSearchChange={setSearchText}
        onStatusFilterChange={setStatusFilter}
        isRegistered={isEventRegistered}
        isRegistrationCancelled={isRegistrationCancelled}
        getEventTypeText={getEventTypeText}
        formatDate={formatDate}
        onAssign={openAssignForm}
        onEdit={(id) => navigate(`/events/${id}`)}
        onCancel={cancelEvent}
        onRegister={registerForEvent}
        onCancelRegistration={cancelRegistration}
      />

    </div>
  )
}

export default Events
