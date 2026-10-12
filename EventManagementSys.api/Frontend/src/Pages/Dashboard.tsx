
import { useEffect, useState, useCallback } from 'react'
import { useMsal } from '@azure/msal-react'
import {
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  Inject,
  Month,
  Week,
  WorkWeek,
  Day,
  Agenda,
} from '@syncfusion/ej2-react-schedule'

type EventStatus = 'Scheduled' | 'Cancelled' | 'Completed'

interface EventDto {
  eventId: number
  eventName: string
  startDate: string
  endDate: string
  budget?: number | null
  eventType: number
  status: EventStatus | number
  venueId?: number | null
  orgId?: number | null
}

interface VenueOption {
  venueId: number
  venueName: string
}

interface OrganizationOption {
  orgId: number
  orgName: string
}

interface EventFormData {
  eventName: string
  eventType: string
  startDate: string
  endDate: string
  venueId: string
  orgId: string
  budget: string
}

const emptyForm: EventFormData = {
  eventName: '',
  eventType: '0',
  startDate: '',
  endDate: '',
  venueId: '',
  orgId: '',
  budget: '',
}

function toDateTimeLocal(value: string | Date): string {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function getObjectId(
  obj: Record<string, unknown>,
  ...keys: string[]
): number {
  for (const key of keys) {
    const value = obj[key]

    if (typeof value === 'number' && Number.isInteger(value)) {
      return value
    }

    if (
      typeof value === 'string' &&
      value.trim() !== '' &&
      Number.isInteger(Number(value))
    ) {
      return Number(value)
    }
  }

  return 0
}

function getObjectString(
  obj: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = obj[key]

    if (typeof value === 'string' && value.trim() !== '') {
      return value
    }
  }

  return ''
}

function Dashboard() {
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const accountId = account?.homeAccountId

  const roles = (account?.idTokenClaims?.roles as string[]) ?? []
  const canManageEvents =
    roles.includes('Admin') || roles.includes('Employee')
  const isAttendee = roles.includes('Attendee')

  const API_SCOPE =
    'api://0332cc25-1dc3-4542-b1cd-a1ad23d0f620/access_as_user'

  const [events, setEvents] = useState<EventDto[]>([])
  const [venues, setVenues] = useState<VenueOption[]>([])
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [formData, setFormData] = useState<EventFormData>(emptyForm)
  const [savingEvent, setSavingEvent] = useState(false)

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const getAccessToken = useCallback(async () => {
    const activeAccount = instance.getActiveAccount() ?? account

    if (!activeAccount) {
      throw new Error('Please sign in before performing this action.')
    }

    const result = await instance.acquireTokenSilent({
      scopes: [API_SCOPE],
      account: activeAccount,
    })

    return result.accessToken
  }, [accountId, instance])

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      let response: Response

      if (isAttendee) {
        const token = await getAccessToken()

        response = await fetch('/api/events/my-registrations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } else {
        response = await fetch('/api/events')
      }

      if (!response.ok) {
        throw new Error(`Failed to load events (${response.status}).`)
      }

      const data: EventDto[] = await response.json()
      setEvents(data)
    } catch (err) {
      console.error('Error loading events:', err)
      setError(err instanceof Error ? err.message : 'Unable to load events.')
    } finally {
      setLoading(false)
    }
  }, [getAccessToken, isAttendee])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  // Load venue and organization records through their API endpoints.
  useEffect(() => {
    let active = true

    const loadDropdowns = async () => {
      try {
        const [venueResponse, organizationResponse] = await Promise.all([
          fetch('/api/venues'),
          fetch('/api/organizations'),
        ])

        if (!venueResponse.ok) {
          throw new Error(`Failed to load venues (${venueResponse.status}).`)
        }

        if (!organizationResponse.ok) {
          throw new Error(
            `Failed to load organizations (${organizationResponse.status}).`,
          )
        }

        const venueJson: unknown = await venueResponse.json()
        const organizationJson: unknown = await organizationResponse.json()

        if (!Array.isArray(venueJson)) {
          throw new Error('The venues API did not return a list.')
        }

        if (!Array.isArray(organizationJson)) {
          throw new Error('The organizations API did not return a list.')
        }

        const venueData: VenueOption[] = venueJson
          .map((item: unknown) => {
            const obj = item as Record<string, unknown>

            return {
              venueId: getObjectId(
                obj,
                'venueId',
                'VenueId',
                'id',
                'Id',
              ),
              venueName: getObjectString(
                obj,
                'venueName',
                'VenueName',
                'name',
                'Name',
              ),
            }
          })
          .filter(venue => venue.venueId > 0 && venue.venueName !== '')

        const organizationData: OrganizationOption[] = organizationJson
          .map((item: unknown) => {
            const obj = item as Record<string, unknown>

            return {
              orgId: getObjectId(
                obj,
                'orgId',
                'OrgId',
                'organizationId',
                'OrganizationId',
                'id',
                'Id',
              ),
              orgName: getObjectString(
                obj,
                'orgName',
                'OrgName',
                'organizationName',
                'OrganizationName',
                'name',
                'Name',
              ),
            }
          })
          .filter(
            organization =>
              organization.orgId > 0 && organization.orgName !== '',
          )

        console.log('Venue options received:', venueData)
        console.log('Organization options received:', organizationData)

        if (active) {
          setVenues(venueData)
          setOrganizations(organizationData)

          if (venueData.length === 0) {
            console.warn(
              'No venue options were mapped. Check the VenueResponseDto property names and API response.',
            )
          }

          if (organizationData.length === 0) {
            console.warn(
              'No organization options were mapped. Check the OrganizationResponseDto property names and API response.',
            )
          }
        }
      } catch (err) {
        console.error('Failed to load dropdowns:', err)

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load venues and organizations.',
          )
        }
      }
    }

    void loadDropdowns()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const refresh = () => void loadEvents()

    const visibility = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', visibility)

    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [loadEvents])

  const getEventStatus = (
    status: EventStatus | number,
  ): EventStatus => {
    if (typeof status === 'number') {
      if (status === 1) return 'Cancelled'
      if (status === 2) return 'Completed'
      return 'Scheduled'
    }

    return status
  }

  const schedulerEvents = events
    .filter(event => getEventStatus(event.status) !== 'Cancelled')
    .map(event => ({
      Id: event.eventId,
      Subject: event.eventName,
      StartTime: new Date(event.startDate),
      EndTime: new Date(event.endDate),
    }))

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const openCreateEvent = () => {
    if (!canManageEvents) return

    const start = selectedDate ? new Date(selectedDate) : new Date()
    start.setHours(9, 0, 0, 0)

    const end = new Date(start)
    end.setHours(end.getHours() + 1)

    setEditingEventId(null)
    setFormData({
      ...emptyForm,
      startDate: toDateTimeLocal(start),
      endDate: toDateTimeLocal(end),
    })
    setError('')
    setShowEventForm(true)
  }

  const openEditEvent = (eventId: number) => {
    if (!canManageEvents) return

    const event = events.find(item => item.eventId === eventId)

    if (!event) {
      setError('Event not found. Please refresh and try again.')
      return
    }

    if (getEventStatus(event.status) === 'Cancelled') {
      setError('Cancelled events cannot be edited.')
      return
    }

    setEditingEventId(eventId)
    setFormData({
      eventName: event.eventName,
      eventType: String(event.eventType ?? 0),
      startDate: toDateTimeLocal(event.startDate),
      endDate: toDateTimeLocal(event.endDate),
      venueId: event.venueId == null ? '' : String(event.venueId),
      orgId: event.orgId == null ? '' : String(event.orgId),
      budget: event.budget == null ? '' : String(event.budget),
    })

    setError('')
    setShowEventForm(true)
  }

  const closeEventForm = () => {
    if (savingEvent) return

    setShowEventForm(false)
    setEditingEventId(null)
    setFormData(emptyForm)
  }

  const saveCalendarEvent = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault()

    if (!canManageEvents) {
      setError('You do not have permission to manage events.')
      return
    }

    const startDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)
    const venueId = Number(formData.venueId)
    const orgId = formData.orgId ? Number(formData.orgId) : null
    const budget = formData.budget ? Number(formData.budget) : null
    const eventType = Number(formData.eventType)

    if (!formData.eventName.trim() || !formData.venueId) {
      setError('Event name and venue are required.')
      return
    }

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      setError('Enter valid dates. The end must be after the start.')
      return
    }

    if (!Number.isInteger(venueId) || venueId <= 0) {
      setError('Please select a valid venue.')
      return
    }

    if (
      orgId !== null &&
      (!Number.isInteger(orgId) || orgId <= 0)
    ) {
      setError('Please select a valid organization.')
      return
    }

    if (
      budget !== null &&
      (!Number.isFinite(budget) || budget < 0)
    ) {
      setError('Budget must be zero or greater.')
      return
    }

    if (!Number.isInteger(eventType) || eventType < 0 || eventType > 5) {
      setError('Please select a valid event type.')
      return
    }

    try {
      setSavingEvent(true)
      setError('')

      const token = await getAccessToken()
      const isEditing = editingEventId !== null

      const payload = {
        eventName: formData.eventName.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        venueId,
        budget,
        eventType,
        orgId,
      }

      const response = await fetch(
        isEditing ? `/api/events/${editingEventId}` : '/api/events',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const message = await response.text()
        throw new Error(
          message ||
            `Unable to ${isEditing ? 'update' : 'create'} event (${response.status}).`,
        )
      }

      setShowEventForm(false)
      setEditingEventId(null)
      setFormData(emptyForm)

      await loadEvents()
    } catch (err) {
      console.error('Save event failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to save event.')
    } finally {
      setSavingEvent(false)
    }
  }

  const cancelCalendarEvent = async (eventId: number) => {
    if (!canManageEvents) {
      setError('You do not have permission to cancel events.')
      return
    }

    const event = events.find(item => item.eventId === eventId)

    if (!event) {
      setError('Event not found. Refresh the calendar and try again.')
      return
    }

    if (getEventStatus(event.status) === 'Cancelled') {
      setError('This event is already cancelled.')
      return
    }

    if (
      !window.confirm(
        `Cancel "${event.eventName}"? The event will remain in the database.`,
      )
    ) {
      return
    }

    try {
      setError('')

      const token = await getAccessToken()

      const response = await fetch(`/api/events/${eventId}/cancel`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const message = await response.text()

        throw new Error(
          message || `Unable to cancel event (${response.status}).`,
        )
      }

      setShowEventForm(false)
      setEditingEventId(null)
      setFormData(emptyForm)

      await loadEvents()
    } catch (err) {
      console.error('Cancel event failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel event.')
    }
  }

  // Use explicit popup actions rather than Syncfusion's delete behavior.
  const handlePopupOpen = (args: any) => {
    if (args.type !== 'QuickInfo' || !args.data || !canManageEvents) return

    const eventId = Number(
      args.data.Id ?? args.data.EventId ?? args.data.eventId,
    )

    if (!Number.isInteger(eventId) || eventId <= 0) return

    window.setTimeout(() => {
      const popup = document.querySelector<HTMLElement>(
        '.e-quick-popup-wrapper',
      )

      if (!popup) return

      const editButton = popup.querySelector<HTMLElement>(
        '.e-event-edit, .e-edit',
      )

      if (editButton) {
        editButton.onclick = e => {
          e.preventDefault()
          e.stopPropagation()
          openEditEvent(eventId)
        }
      }

      const deleteButton = popup.querySelector<HTMLElement>(
        '.e-event-delete, .e-delete',
      )

      if (deleteButton) {
        deleteButton.style.display = 'none'
      }

      if (popup.querySelector('[data-custom-cancel-event="true"]')) {
        return
      }

      const cancelButton = document.createElement('button')
      cancelButton.type = 'button'
      cancelButton.textContent = 'Cancel Event'
      cancelButton.setAttribute('data-custom-cancel-event', 'true')
      cancelButton.className = 'e-btn e-flat e-primary'
      cancelButton.style.margin = '8px'
      cancelButton.style.color = '#dc2626'

      cancelButton.addEventListener('click', e => {
        e.preventDefault()
        e.stopPropagation()
        void cancelCalendarEvent(eventId)
      })

      const footer = popup.querySelector<HTMLElement>('.e-footer-content')
      ;(footer ?? popup).appendChild(cancelButton)
    }, 0)
  }

  const monthEvents = events.filter(event => {
    if (getEventStatus(event.status) === 'Cancelled') return false

    const date = new Date(event.startDate)

    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    )
  })

  const scheduledEvents = events.filter(
    event => getEventStatus(event.status) === 'Scheduled',
  )

  const cancelledEvents = events.filter(
    event => getEventStatus(event.status) === 'Cancelled',
  )

  const upcomingEvents = events
    .filter(
      event =>
        getEventStatus(event.status) === 'Scheduled' &&
        new Date(event.startDate) >= new Date(),
    )
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )
    .slice(0, 5)

  const applySelectedDateStyle = useCallback(() => {
    const cells = document.querySelectorAll<HTMLElement>(
      '.dashboard-calendar .e-work-cells',
    )

    cells.forEach(cell => {
      cell.style.outline = ''
      cell.style.outlineOffset = ''
      cell.style.boxShadow = ''
      cell.style.backgroundColor = ''

      const dateValue = cell.getAttribute('data-date')

      if (!selectedDate || !dateValue) return

      if (isSameDay(new Date(Number(dateValue)), selectedDate)) {
        cell.style.outline = '2px solid #8b5cf6'
        cell.style.outlineOffset = '-2px'
        cell.style.backgroundColor = '#f5f3ff'
      }
    })
  }, [selectedDate])

  useEffect(() => {
    const timeoutId = window.setTimeout(applySelectedDateStyle, 50)

    return () => window.clearTimeout(timeoutId)
  }, [applySelectedDateStyle, currentDate, loading])

  const handleCellClick = (args: { startTime: Date }) => {
    setSelectedDate(args.startTime)
  }

  // Prevent double-clicking empty cells from opening the default editor.
  const handleCellDoubleClick = (args: any) => {
    args.cancel = true
  }

  // Double-clicking an existing event opens our custom edit form.
  const handleEventDoubleClick = (args: any) => {
    args.cancel = true

    const eventId = Number(
      args.event?.Id ??
        args.event?.EventId ??
        args.event?.eventId ??
        args.data?.Id,
    )

    if (Number.isInteger(eventId) && eventId > 0) {
      openEditEvent(eventId)
    }
  }

  const handleRenderCell = (args: {
    element: HTMLElement
    date?: Date
    type: string
  }) => {
    if (args.type !== 'workCells' || !selectedDate || !args.date) return

    if (isSameDay(args.date, selectedDate)) {
      args.element.style.boxShadow = 'inset 0 0 0 2px #8b5cf6'
      args.element.style.backgroundColor = '#f5f3ff'
    }
  }

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })

  const formatDisplayDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  const userName = account?.name || account?.username || 'User'

  return (
    <div className="min-h-[calc(100vh-68px)] w-full bg-[#f5f8fc] px-[46px] pt-9 pb-[60px] max-[1150px]:px-[25px] max-[700px]:px-[15px]">
      <header className="mx-auto mb-[34px] w-full max-w-[1400px] text-center">
        <p className="mb-[6px] text-[14px] font-[750] tracking-[1.8px] text-[#ff7a00]">
          WINEVENTS
        </p>

        <h1 className="m-0 text-[48px] font-extrabold tracking-[-1px] text-[#111827] max-[700px]:text-[38px]">
          Dashboard
        </h1>

        <p className="mt-3 text-[17px] text-[#6b7280]">
          Welcome back! Here's what's happening with your events.
        </p>

        <p className="mt-[14px] text-[#374151]">
          Welcome, <strong>{userName}</strong>
        </p>
      </header>

      <main className="mx-auto w-full max-w-[1400px]">
        <section className="mb-[30px] grid grid-cols-4 gap-5 max-[900px]:grid-cols-2 max-[700px]:grid-cols-1">
          {[
            { label: 'Total Events', value: events.length, color: '#0066ff' },
            {
              label: 'Scheduled',
              value: scheduledEvents.length,
              color: '#ff7a00',
            },
            {
              label: 'Cancelled',
              value: cancelledEvents.length,
              color: '#dc2626',
            },
            {
              label: 'Upcoming',
              value: upcomingEvents.length,
              color: '#15803d',
            },
          ].map(card => (
            <div
              key={card.label}
              className="rounded-xl border border-[#dfe5ec] border-t-4 bg-white p-[22px] shadow-sm"
              style={{ borderTopColor: card.color }}
            >
              <span className="text-[14px] font-medium text-[#6b7280]">
                {card.label}
              </span>

              <strong className="mt-2 block text-[30px] font-[750] text-[#111827]">
                {card.value}
              </strong>
            </div>
          ))}
        </section>

        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <section className="grid grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)] items-start gap-6 max-[1150px]:grid-cols-1">
          <div className="w-full rounded-[14px] border border-[#dfe5ec] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4 max-[700px]:flex-col max-[700px]:items-start">
              <div>
                <h2 className="m-0 text-xl font-bold text-[#111827]">
                  Event Calendar
                </h2>

                <p className="mt-1 text-sm text-[#6b7280]">
                  {monthEvents.length} event
                  {monthEvents.length === 1 ? '' : 's'} this month
                </p>

                {selectedDate && (
                  <p className="mt-1 text-sm text-[#2563eb]">
                    Selected date:{' '}
                    {selectedDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>

              {canManageEvents && (
                <button
                  type="button"
                  onClick={openCreateEvent}
                  className="shrink-0 rounded-lg bg-[#ff7a00] px-4 py-2.5 font-semibold text-white hover:bg-[#e65f00]"
                >
                  + Add Event
                </button>
              )}
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-[#6b7280]">
                Loading events...
              </p>
            ) : (
              <ScheduleComponent
                cssClass="dashboard-calendar"
                height="650px"
                selectedDate={currentDate}
                currentView="Month"
                readonly={!canManageEvents}
                showQuickInfo={true}
                eventSettings={{ dataSource: schedulerEvents }}
                cellClick={handleCellClick}
                cellDoubleClick={handleCellDoubleClick}
                eventDoubleClick={handleEventDoubleClick}
                popupOpen={handlePopupOpen}
                renderCell={handleRenderCell}
                navigating={(args: any) => {
                  if (args.currentDate) {
                    setCurrentDate(args.currentDate)
                    setSelectedDate(null)
                  }
                }}
              >
                <ViewsDirective>
                  <ViewDirective option="Month" />
                  <ViewDirective option="Week" />
                  <ViewDirective option="WorkWeek" />
                  <ViewDirective option="Day" />
                  <ViewDirective option="Agenda" />
                </ViewsDirective>

                <Inject services={[Month, Week, WorkWeek, Day, Agenda]} />
              </ScheduleComponent>
            )}

            {showEventForm && canManageEvents && (
              <div className="mt-6 rounded-xl border border-[#dfe5ec] bg-[#f9fafb] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-[#111827]">
                    {editingEventId === null ? 'Create Event' : 'Edit Event'}
                  </h3>

                  <button
                    type="button"
                    disabled={savingEvent}
                    onClick={closeEventForm}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  >
                    Close
                  </button>
                </div>

                <form
                  onSubmit={saveCalendarEvent}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <label className="grid gap-1 text-sm font-medium">
                    Event name
                    <input
                      required
                      value={formData.eventName}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          eventName: e.target.value,
                        })
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                    />
                  </label>

                  <label className="grid gap-1 text-sm font-medium">
                    Event type
                    <select
                      required
                      value={formData.eventType}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          eventType: e.target.value,
                        })
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                    >
                      <option value="0">Conference</option>
                      <option value="1">Workshop</option>
                      <option value="2">Webinar</option>
                      <option value="3">Cultural Fest</option>
                      <option value="4">Meeting</option>
                      <option value="5">Product Launch</option>
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm font-medium">
                    Start date and time
                    <input
                      type="datetime-local"
                      required
                      value={formData.startDate}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          startDate: e.target.value,
                        })
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                    />
                  </label>

                  <label className="grid gap-1 text-sm font-medium">
                    End date and time
                    <input
                      type="datetime-local"
                      required
                      value={formData.endDate}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          endDate: e.target.value,
                        })
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                    />
                  </label>

                  <label className="grid gap-1 text-sm font-medium">
                    Venue
                    <select
                      required
                      value={formData.venueId}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          venueId: e.target.value,
                        })
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                    >
                      <option value="">Select a venue</option>

                      {venues.map(venue => (
                        <option key={venue.venueId} value={venue.venueId}>
                          {venue.venueName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm font-medium">
                    Organization (optional)
                    <select
                      value={formData.orgId}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          orgId: e.target.value,
                        })
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                    >
                      <option value="">No organization</option>

                      {organizations.map(organization => (
                        <option
                          key={organization.orgId}
                          value={organization.orgId}
                        >
                          {organization.orgName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm font-medium sm:col-span-2">
                    Budget (optional)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.budget}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          budget: e.target.value,
                        })
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                    />
                  </label>

                  <div className="flex gap-3 sm:col-span-2">
                    <button
                      type="submit"
                      disabled={savingEvent}
                      className="rounded-lg bg-[#ff7a00] px-5 py-2.5 font-semibold text-white hover:bg-[#e65f00] disabled:opacity-60"
                    >
                      {savingEvent
                        ? 'Saving...'
                        : editingEventId === null
                          ? 'Create Event'
                          : 'Save Changes'}
                    </button>

                    <button
                      type="button"
                      disabled={savingEvent}
                      onClick={closeEventForm}
                      className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-semibold disabled:opacity-60"
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            )}

            <p className="mt-3 text-xs text-[#6b7280]">
              {canManageEvents
                ? 'Use Add Event to create an event. Open an event popup to edit or cancel it. Double-click an existing event to edit it.'
                : 'Select a calendar event to view it.'}
            </p>
          </div>

          <div className="w-full rounded-[14px] border border-[#dfe5ec] bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="m-0 text-[21px] font-[750] text-[#111827]">
                Upcoming Events
              </h2>

              <p className="mt-[5px] text-[13px] text-[#6b7280]">
                Your next scheduled events
              </p>
            </div>

            {loading && (
              <p className="py-6 text-center text-sm text-[#6b7280]">
                Loading events...
              </p>
            )}

            {!loading && upcomingEvents.length === 0 && (
              <p className="py-6 text-center text-sm text-[#6b7280]">
                No upcoming events.
              </p>
            )}

            {!loading &&
              upcomingEvents.map(event => {
                const eventDate = new Date(event.startDate)

                return (
                  <div
                    key={event.eventId}
                    className="flex items-center gap-[14px] border-b border-[#edf0f4] py-[14px] last:border-b-0"
                  >
                    <div className="flex h-[60px] w-[55px] shrink-0 flex-col items-center justify-center rounded-[9px] border border-[#cfe0ff] bg-[#eaf2ff]">
                      <strong className="text-[21px] font-extrabold leading-none text-[#0066ff]">
                        {eventDate.getDate()}
                      </strong>

                      <span className="mt-1 text-[10px] font-extrabold tracking-[0.7px] text-[#ff7a00]">
                        {eventDate
                          .toLocaleString('en-US', { month: 'short' })
                          .toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h3 className="m-0 font-semibold text-[#111827]">
                        {event.eventName}
                      </h3>

                      <p className="m-0 mt-1 text-[12px] text-[#6b7280]">
                        {formatDisplayDate(event.startDate)}
                      </p>

                      <p className="m-0 text-[12px] text-[#6b7280]">
                        {formatTime(event.startDate)}
                      </p>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
