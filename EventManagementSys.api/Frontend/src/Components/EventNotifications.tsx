
import { useEffect, useRef, useState } from 'react'
import { useMsal } from '@azure/msal-react'

type EventStatus = 'Scheduled' | 'Cancelled' | 'Completed'

interface EventDto {
  eventId: number
  eventName: string
  startDate: string
  endDate: string
  status: EventStatus | number
}

interface EmployeeTaskDto {
  assignmentId: number
  eventId: number
  eventName: string
  employeeId: number
  task: string
  deadline: string | null
  status: string
}
interface NotificationItem {
  id: number
  title: string
  message: string
  startDate: string
  createdAt: number
  read: boolean
}

const API_SCOPE =
  'api://0332cc25-1dc3-4542-b1cd-a1ad23d0f620/access_as_user'

const REMINDER_WINDOW_MS = 15 * 60 * 1000

function getEventStatus(status: EventStatus | number): EventStatus {
  if (typeof status === 'number') {
    if (status === 1) return 'Cancelled'
    if (status === 2) return 'Completed'
    return 'Scheduled'
  }

  return status
}

function formatEventTime(date: string) {
  return new Date(date).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function EventNotifications() {
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const accountId = account?.homeAccountId
  const roles = (account?.idTokenClaims?.roles as string[]) ?? []
  const isAttendee = roles.includes('Attendee')
  const isEmployee = roles.includes('Employee') || roles.includes('Admin')

  const [events, setEvents] = useState<EventDto[]>([])
  const [tasks, setTasks] = useState<EmployeeTaskDto[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('')

  const notifiedEventIds = useRef<Set<number>>(new Set())
  const notifiedTaskReminders = useRef<Set<string>>(new Set())
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch the events visible to the current user.
  useEffect(() => {
    if (!account) {
      setEvents([])
      return
    }

    let isMounted = true

    const loadEvents = async () => {
      try {
        let response: Response

        if (isAttendee) {
          const tokenResponse = await instance.acquireTokenSilent({
            scopes: [API_SCOPE],
            account,
          })

          response = await fetch('/api/events/my-registrations', {
            headers: {
              Authorization: `Bearer ${tokenResponse.accessToken}`,
            },
          })
        } else {
          response = await fetch('/api/events')
        }

        if (!response.ok) {
          throw new Error(`Unable to load events (${response.status}).`)
        }

        const data: EventDto[] = await response.json()

        if (isMounted) {
          setEvents(data)
          setError('')
        }
      } catch (err) {
        console.error('Unable to load notification events:', err)

        if (isMounted) {
          setError('Could not refresh event reminders.')
        }
      }
    }

    void loadEvents()

    // Refresh in case an event is added, changed, or cancelled.
    const refreshId = window.setInterval(() => {
      void loadEvents()
    }, 60_000)

    return () => {
      isMounted = false
      window.clearInterval(refreshId)
    }
  }, [accountId, instance, isAttendee])

  useEffect(() => {
    if (!account || !isEmployee) {
      setTasks([])
      return
    }

    let isMounted = true

    const loadTasks = async () => {
      try {
        const tokenResponse = await instance.acquireTokenSilent({
          scopes: [API_SCOPE],
          account,
        })
        const response = await fetch('/api/employees/my-tasks', {
          headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
        })

        if (!response.ok) {
          throw new Error(`Unable to load assigned tasks (${response.status}).`)
        }

        const data: EmployeeTaskDto[] = await response.json()
        if (isMounted) setTasks(data)
      } catch (err) {
        console.error('Unable to load task reminders:', err)
      }
    }

    void loadTasks()
    const refreshId = window.setInterval(() => void loadTasks(), 60_000)

    return () => {
      isMounted = false
      window.clearInterval(refreshId)
    }
  }, [accountId, instance, isEmployee])

  // Check upcoming events frequently so reminders appear near the
  // 15-minute mark, including when the app opens within that window.
  useEffect(() => {
    const checkUpcomingEvents = () => {
      const now = Date.now()

      for (const event of events) {
        if (getEventStatus(event.status) === 'Cancelled') continue
        if (notifiedEventIds.current.has(event.eventId)) continue

        const startTime = new Date(event.startDate).getTime()

        if (!Number.isFinite(startTime) || startTime <= now) continue

        const timeUntilStart = startTime - now

        if (timeUntilStart <= REMINDER_WINDOW_MS) {
          notifiedEventIds.current.add(event.eventId)

          setNotifications((current) => [
            {
              id: event.eventId,
              title: 'Event starting soon',
              message: `${event.eventName} starts at ${formatEventTime(event.startDate)}.`,
              startDate: event.startDate,
              createdAt: now,
              read: false,
            },
            ...current,
          ])
        }
      }
    }

    checkUpcomingEvents()

    const checkId = window.setInterval(checkUpcomingEvents, 15_000)

    return () => window.clearInterval(checkId)
  }, [events])

  useEffect(() => {
    const checkTaskDeadlines = () => {
      const now = Date.now()
      const reminderStages = [
        { key: '24-hours', threshold: 24 * 60 * 60 * 1000, lowerBound: 2 * 60 * 60 * 1000, timeLeft: '24 hours' },
        { key: '2-hours', threshold: 2 * 60 * 60 * 1000, lowerBound: 30 * 60 * 1000, timeLeft: '2 hours' },
        { key: '30-minutes', threshold: 30 * 60 * 1000, lowerBound: 0, timeLeft: '0.5 hours (30 minutes)' },
      ]

      for (const task of tasks) {
        if (!task.deadline || task.status.toLowerCase() === 'completed') continue

        const deadline = new Date(task.deadline).getTime()
        const timeRemaining = deadline - now
        if (!Number.isFinite(deadline)) continue

        if (timeRemaining <= 0) {
          const overdueKey = `${task.assignmentId}:${task.employeeId}:${task.task}:${task.deadline}:overdue`
          if (notifiedTaskReminders.current.has(overdueKey)) continue

          notifiedTaskReminders.current.add(overdueKey)
          setNotifications(current => [
            {
              id: task.assignmentId,
              title: 'Task overdue',
              message: `${task.eventName} | ${task.task}: the deadline has passed and this task is still incomplete.`,
              startDate: task.deadline!,
              createdAt: now,
              read: false,
            },
            ...current,
          ])
          continue
        }

        const stage = reminderStages.find(
          reminder => timeRemaining <= reminder.threshold && timeRemaining > reminder.lowerBound,
        )
        if (!stage) continue

        const reminderKey = `${task.assignmentId}:${task.employeeId}:${task.task}:${task.deadline}:${stage.key}`
        if (notifiedTaskReminders.current.has(reminderKey)) continue

        notifiedTaskReminders.current.add(reminderKey)
        setNotifications(current => [
          {
            id: task.eventId,
            title: 'Task deadline reminder',
            message: `${task.eventName} | ${task.task}: ${stage.timeLeft} left to complete.`,
            startDate: task.deadline,
            createdAt: now,
            read: false,
          },
          ...current,
        ])
      }
    }

    checkTaskDeadlines()
    const checkId = window.setInterval(checkTaskDeadlines, 15_000)
    return () => window.clearInterval(checkId)
  }, [tasks])

  // Close the notification panel when clicking outside it.
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const unreadCount = notifications.filter((item) => !item.read).length

  const toggleNotifications = () => {
    setIsOpen((open) => !open)
    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true })),
    )
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={toggleNotifications}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Notifications
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Event and task reminders
              </p>
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearNotifications}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            )}
          </div>

          {error && (
            <p className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800">
              {error}
            </p>
          )}

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-800">
                  You're all caught up
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  We'll remind you before events and assigned task deadlines.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={`${item.id}-${item.createdAt}`}
                  className="flex gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0 hover:bg-gray-50"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {item.title}
                      </p>
                      {!item.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="mt-1 break-words text-sm text-gray-600">
                      {item.message}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {formatEventTime(item.startDate)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default EventNotifications
