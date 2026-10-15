import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'

const auth = vi.hoisted(() => ({ useMsal: vi.fn() }))
vi.mock('@azure/msal-react', () => ({ useMsal: auth.useMsal }))
vi.mock('../src/Components/Login', () => ({ default: () => <p>Login screen</p> }))
vi.mock('../src/Components/Navigationbar', () => ({ default: () => <nav>Navigation</nav> }))
vi.mock('../src/Pages/Dashboard', () => ({ default: () => <p>Dashboard page</p> }))
vi.mock('../src/Pages/Events', () => ({ default: () => <p>Events page</p> }))
vi.mock('../src/Pages/Participants', () => ({ default: () => <p>Participants page</p> }))
vi.mock('../src/Pages/Administration', () => ({ default: () => <p>Administration page</p> }))
vi.mock('../src/Pages/EmployeeTasks', () => ({ default: () => <p>Employee tasks page</p> }))

const instance = { getActiveAccount: vi.fn() }
const account = (roles: string[]) => ({ idTokenClaims: { roles } })

function open(path: string, roles: string[]) {
  window.history.replaceState({}, '', path)
  instance.getActiveAccount.mockReturnValue(account(roles))
  auth.useMsal.mockReturnValue({ instance, accounts: [account(roles)] })
  return render(<App />)
}

beforeEach(() => {
  window.history.replaceState({}, '', '/')
  vi.clearAllMocks()
})

describe('App role routes', () => {
  it('renders login and redirects unknown routes to login', () => {
    const { unmount } = open('/', [])
    expect(screen.getByText('Login screen')).toBeInTheDocument()
    unmount()
    open('/not-a-page', [])
    expect(screen.getByText('Login screen')).toBeInTheDocument()
  })

  it('renders the shared layout and allows Admin routes', () => {
    open('/administration', ['Admin'])
    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Administration page')).toBeInTheDocument()
  })

  it('redirects attendees from restricted routes to dashboard and preserves event detail route', () => {
    const { unmount } = open('/participants', ['Attendee'])
    expect(screen.getByText('Dashboard page')).toBeInTheDocument()
    expect(screen.queryByText('Participants page')).not.toBeInTheDocument()
    unmount()
    open('/events/22', ['Attendee'])
    expect(screen.getByText('Events page')).toBeInTheDocument()
  })

  it('allows employees on participant and task routes but denies administration', () => {
    const { unmount } = open('/participants', ['Employee'])
    expect(screen.getByText('Participants page')).toBeInTheDocument()
    unmount()
    open('/my-tasks', ['Employee'])
    expect(screen.getByText('Employee tasks page')).toBeInTheDocument()
  })

  it('uses the first account when no active account is set and denies access without roles', () => {
    const fallbackUser = account(['Employee'])
    instance.getActiveAccount.mockReturnValue(null as any)
    auth.useMsal.mockReturnValue({ instance, accounts: [fallbackUser] })
    window.history.replaceState({}, '', '/participants')
    const { unmount } = render(<App />)
    expect(screen.getByText('Participants page')).toBeInTheDocument()
    unmount()

    instance.getActiveAccount.mockReturnValue(null as any)
    auth.useMsal.mockReturnValue({ instance, accounts: [] })
    window.history.replaceState({}, '', '/administration')
    render(<App />)
    expect(screen.getByText('Dashboard page')).toBeInTheDocument()
  })
})
