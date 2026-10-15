import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EventNotifications from '../src/Components/EventNotifications'

const auth = vi.hoisted(() => ({ useMsal: vi.fn() }))
vi.mock('@azure/msal-react', () => ({ useMsal: auth.useMsal }))

const account = { homeAccountId: 'account-1', idTokenClaims: { roles: ['Employee'] } }
const instance = {
  getActiveAccount: vi.fn(() => account),
  acquireTokenSilent: vi.fn(async () => ({ accessToken: 'access-token' })),
}
const response = (data: unknown, ok = true, status = 200) => ({ ok, status, json: async () => data })
const task = (overrides: Record<string, unknown> = {}) => ({
  assignmentId: 1, eventId: 4, eventName: 'Town Hall', employeeId: 9, name: 'Jordan',
  task: 'Prepare room', deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(), status: 'Pending', ...overrides,
})
let fetchMock: ReturnType<typeof vi.fn>

function setRole(roles: string[]) {
  const user = { ...account, idTokenClaims: { roles } }
  instance.getActiveAccount.mockReturnValue(user as typeof account)
  auth.useMsal.mockReturnValue({ instance, accounts: [user] })
}

beforeEach(() => {
  vi.clearAllMocks()
  setRole(['Employee'])
  fetchMock = vi.fn(async (url: string) => {
    if (url === '/api/events') return response([])
    if (url === '/api/employees/my-tasks') return response([])
    return response([])
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('Event notifications', () => {
  it('shows an empty state, toggles open and closed, closes outside or on Escape', async () => {
    render(<EventNotifications />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/events'))
    const button = screen.getByRole('button', { name: 'Notifications' })
    fireEvent.click(button)
    expect(screen.getByText("You're all caught up")).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument()
    fireEvent.click(button)
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument()
  })

  it('sends attendees to registered events and reports an event request error', async () => {
    setRole(['Attendee'])
    fetchMock.mockImplementation(async (url: string) => url === '/api/events/my-registrations'
      ? response([], false, 503)
      : response([]))
    render(<EventNotifications />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/events/my-registrations', {
      headers: { Authorization: 'Bearer access-token' },
    }))
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(await screen.findByText('Could not refresh event reminders.')).toBeInTheDocument()
    expect(instance.acquireTokenSilent).toHaveBeenCalled()
  })

  it('shows the empty notification panel without a signed-in account', async () => {
    auth.useMsal.mockReturnValue({ instance: { getActiveAccount: () => null }, accounts: [] })
    render(<EventNotifications />)
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(screen.getByText("You're all caught up")).toBeInTheDocument()
  })

  it('handles employee task and admin assignment fetch failures without creating alerts', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/employees/my-tasks') return response('task api unavailable', false, 503)
      if (url === '/api/events') return response([{ eventId: 90, eventName: 'Expo', startDate: new Date(Date.now() + 86_400_000).toISOString(), endDate: '', status: 0 }])
      if (url === '/api/events/90/staff') return response('assignment api unavailable', false, 503)
      return response([])
    })
    const employeeRender = render(<EventNotifications />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/employees/my-tasks', expect.anything()))
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(screen.getByText("You're all caught up")).toBeInTheDocument()
    employeeRender.unmount()

    setRole(['Admin'])
    const { unmount } = render(<EventNotifications />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/events/90/staff', expect.anything()))
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(screen.getByText("You're all caught up")).toBeInTheDocument()
    unmount()
  })

  it('reports upcoming non-cancelled events and can clear all notifications', async () => {
    const soon = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    const past = new Date(Date.now() - 60_000).toISOString()
    fetchMock.mockImplementation(async (url: string) => url === '/api/events'
      ? response([
          { eventId: 1, eventName: 'Soon Event', startDate: soon, endDate: soon, status: 'Scheduled' },
          { eventId: 2, eventName: 'Cancelled Event', startDate: soon, endDate: soon, status: 1 },
          { eventId: 3, eventName: 'Past Event', startDate: past, endDate: past, status: 'Scheduled' },
          { eventId: 4, eventName: 'Bad Date', startDate: 'invalid', endDate: 'invalid', status: 9 },
          { eventId: 5, eventName: 'Completed Status Event', startDate: soon, endDate: soon, status: 2 },
        ])
      : response([]))
    render(<EventNotifications />)
    const button = await screen.findByRole('button', { name: 'Notifications, 2 unread' })
    fireEvent.click(button)
    expect(screen.getAllByText('Event starting soon')).toHaveLength(2)
    expect(screen.getByText(/Soon Event starts at/)).toBeInTheDocument()
    expect(screen.getByText(/Completed Status Event starts at/)).toBeInTheDocument()
    expect(screen.queryByText('Cancelled Event')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(screen.getByText("You're all caught up")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
  })

  it('caps the unread badge at 9+', async () => {
    const soon = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    fetchMock.mockImplementation(async (url: string) => url === '/api/events'
      ? response(Array.from({ length: 10 }, (_, index) => ({ eventId: index + 1, eventName: `Event ${index + 1}`, startDate: soon, endDate: soon, status: 'Scheduled' })))
      : response([]))
    render(<EventNotifications />)
    expect(await screen.findByRole('button', { name: 'Notifications, 10 unread' })).toHaveTextContent('9+')
  })

  it('creates each task reminder stage, overdue messages, ignores completed tasks, and marks them read on open', async () => {
    const now = Date.now()
    const deadlines = [24 * 60 * 60 * 1000 - 1000, 90 * 60 * 1000, 15 * 60 * 1000, -1000]
    fetchMock.mockImplementation(async (url: string) => url === '/api/employees/my-tasks'
      ? response([
          ...deadlines.map((delta, index) => task({ assignmentId: index + 1, task: `Task ${index + 1}`, deadline: new Date(now + delta).toISOString() })),
          task({ assignmentId: 5, task: 'Done', status: 'Completed', deadline: new Date(now - 1000).toISOString() }),
          task({ assignmentId: 6, task: 'No date', deadline: null }),
          task({ assignmentId: 7, task: 'Invalid date', deadline: 'invalid' }),
        ])
      : response([]))
    render(<EventNotifications />)
    const button = await screen.findByRole('button', { name: 'Notifications, 4 unread' })
    fireEvent.click(button)
    const panel = screen.getByText('Event and task reminders').closest('div')!.parentElement!.parentElement!
    expect((await within(panel).findAllByText('Task deadline reminder')).length).toBe(3)
    expect(within(panel).getByText('Task overdue')).toBeInTheDocument()
    expect(within(panel).getByText(/24 hours left to complete/)).toBeInTheDocument()
    expect(within(panel).getByText(/2 hours left to complete/)).toBeInTheDocument()
    expect(within(panel).getByText(/0.5 hours \(30 minutes\) left to complete/)).toBeInTheDocument()
    expect(within(panel).getByText(/deadline has passed/)).toBeInTheDocument()
    expect(within(panel).queryByText(/Done/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
  })

  it('notifies admins about overdue employee tasks and newly completed assignments', async () => {
    setRole(['Admin'])
    let staff = [task({ assignmentId: 20, task: 'Set up stage', deadline: new Date(Date.now() - 60_000).toISOString() })]
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/events') return response([{ eventId: 77, eventName: 'Gala', startDate: new Date(Date.now() + 86_400_000).toISOString(), endDate: '', status: 0 }])
      if (url === '/api/events/77/staff') return response(staff)
      if (url === '/api/employees/my-tasks') return response([])
      return response([])
    })
    const { unmount } = render(<EventNotifications />)
    const button = await screen.findByRole('button', { name: 'Notifications, 1 unread' })
    fireEvent.click(button)
    expect(screen.getByText('Employee task overdue')).toBeInTheDocument()
    expect(screen.getByText(/Jordan is past due on "Set up stage" for Town Hall/)).toBeInTheDocument()
    unmount()

    vi.useFakeTimers()
    staff = [task({ assignmentId: 21, task: 'Confirm catering', status: 'Pending', deadline: null })]
    const mounted = render(<EventNotifications />)
    await act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() })
    staff = [{ ...staff[0], status: 'Completed' }]
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Notifications, 1 unread' }))
    expect(screen.getByText('Task completed')).toBeInTheDocument()
    expect(screen.getByText(/Jordan completed "Confirm catering" for Town Hall/)).toBeInTheDocument()
    mounted.unmount()
    vi.useRealTimers()
  })
})
