import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';

const auth = vi.hoisted(() => ({ useMsal: vi.fn() }));
vi.mock('@azure/msal-react', () => ({ useMsal: auth.useMsal }));
vi.mock('../src/shared/components/Login', () => ({ default: () => <p>Login screen</p> }));
vi.mock('../src/shared/components/Navigationbar', () => ({ default: () => <nav>Navigation</nav> }));
vi.mock('../src/features/dashboard', () => ({ default: () => <p>Dashboard page</p> }));
vi.mock('../src/features/events', () => ({ default: () => <p>Events page</p> }));
vi.mock('../src/features/participants', () => ({ default: () => <p>Participants page</p> }));
vi.mock('../src/features/administration', () => ({ default: () => <p>Administration page</p> }));
vi.mock('../src/features/tasks', () => ({ default: () => <p>Employee tasks page</p> }));

const account = (roles: string[]) => ({ idTokenClaims: { roles } });
const instance = { getActiveAccount: vi.fn((): object | null => null) };

function open(path: string, roles: string[]) {
  window.history.replaceState({}, '', path);
  instance.getActiveAccount.mockReturnValue(account(roles));
  auth.useMsal.mockReturnValue({ instance, accounts: [account(roles)] });
  return render(<App />);
}

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  vi.clearAllMocks();
});

describe('App role routes', () => {
  it('renders login and shows a not found page for unknown routes', async () => {
    const { unmount } = open('/', []);
    expect(await screen.findByText('Login screen')).toBeInTheDocument();
    unmount();
    open('/not-a-page', []);
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });

  it('renders the shared layout and allows Admin routes', async () => {
    open('/administration', ['Admin']);
    expect(await screen.findByText('Navigation')).toBeInTheDocument();
    expect(await screen.findByText('Administration page')).toBeInTheDocument();
  });

  it('redirects attendees from restricted routes and preserves event detail route', async () => {
    const { unmount } = open('/participants', ['Attendee']);
    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
    expect(screen.queryByText('Participants page')).not.toBeInTheDocument();
    unmount();
    open('/events/22', ['Attendee']);
    expect(await screen.findByText('Events page')).toBeInTheDocument();
  });

  it('allows employees on participant and task routes but denies administration', async () => {
    const { unmount } = open('/participants', ['Employee']);
    expect(await screen.findByText('Participants page')).toBeInTheDocument();
    unmount();
    open('/my-tasks', ['Employee']);
    expect(await screen.findByText('Employee tasks page')).toBeInTheDocument();
  });

  it('uses the first account when no active account is set and denies access without roles', async () => {
    const fallbackUser = account(['Employee']);
    instance.getActiveAccount.mockReturnValue(null);
    auth.useMsal.mockReturnValue({ instance, accounts: [fallbackUser] });
    window.history.replaceState({}, '', '/participants');
    const { unmount } = render(<App />);
    expect(await screen.findByText('Participants page')).toBeInTheDocument();
    unmount();

    instance.getActiveAccount.mockReturnValue(null);
    auth.useMsal.mockReturnValue({ instance, accounts: [] });
    window.history.replaceState({}, '', '/administration');
    render(<App />);
    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
  });
});
