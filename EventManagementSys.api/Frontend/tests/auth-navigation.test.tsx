import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type * as ReactRouter from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../src/shared/components/Login';
import Navigationbar from '../src/shared/components/Navigationbar';
import ProfileMenu from '../src/shared/components/ProfileMenu';

const auth = vi.hoisted(() => ({
  useMsal: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@azure/msal-react', () => ({ useMsal: auth.useMsal }));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouter>();
  return { ...actual, useNavigate: () => auth.navigate };
});
vi.mock('../src/shared/components/EventNotifications', () => ({
  default: () => <button>Notifications</button>,
}));

const user = {
  name: 'Ananya Urlam',
  username: 'ananya@example.com',
  idTokenClaims: { roles: ['Admin', 'Employee'] },
};
const instance = {
  getActiveAccount: vi.fn((): object | null => user),
  setActiveAccount: vi.fn(),
  loginRedirect: vi.fn(),
  logoutRedirect: vi.fn(),
};

function setMsal(
  options: { accounts?: object[]; active?: object | null; inProgress?: string } = {},
) {
  const accounts = options.accounts ?? [user];
  instance.getActiveAccount.mockReturnValue(
    (options.active === undefined ? accounts[0] : options.active) as typeof user,
  );
  auth.useMsal.mockReturnValue({ instance, accounts, inProgress: options.inProgress ?? 'none' });
}

beforeEach(() => {
  vi.clearAllMocks();
  setMsal();
});

describe('Login', () => {
  it('activates an existing account and routes to dashboard', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    expect(instance.setActiveAccount).toHaveBeenCalledWith(user);
    expect(auth.navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('starts sign in when no account is active and interaction is idle', () => {
    setMsal({ accounts: [], active: null });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    expect(instance.loginRedirect).toHaveBeenCalledWith({ scopes: ['User.Read'] });
  });

  it('waits while an authentication interaction is in progress', () => {
    setMsal({ accounts: [], active: null, inProgress: 'login' });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    expect(instance.loginRedirect).not.toHaveBeenCalled();
  });
});

describe('Profile menu', () => {
  it.each([
    [['Admin'], 'Admin'],
    [['Employee'], 'Employee'],
    [['Attendee'], 'Attendee'],
    [[], 'User'],
  ])('shows role %s and user initials', (roles, expectedRole) => {
    const account = { ...user, idTokenClaims: { roles } };
    instance.getActiveAccount.mockReturnValue(null);
    auth.useMsal.mockReturnValue({ instance, accounts: [account] });
    render(<ProfileMenu />);
    expect(screen.getByText(expectedRole)).toBeInTheDocument();
    expect(screen.getByText('AU')).toBeInTheDocument();
  });

  it('opens the menu, signs out, and closes on Escape or outside click', () => {
    render(<ProfileMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Open profile menu' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: /Sign out/ }));
    expect(instance.logoutRedirect).toHaveBeenCalledWith({
      account: user,
      postLogoutRedirectUri: window.location.origin,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open profile menu' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open profile menu' }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('uses username when the account has no display name and falls back to User', () => {
    instance.getActiveAccount.mockReturnValue(null);
    auth.useMsal.mockReturnValue({
      instance,
      accounts: [{ username: 'person@example.com', idTokenClaims: {} }],
    });
    render(<ProfileMenu />);
    expect(screen.getByText('person@example.com')).toBeInTheDocument();
    expect(screen.getByText('PE')).toBeInTheDocument();
    auth.useMsal.mockReturnValue({ instance, accounts: [] });
    render(<ProfileMenu />);
    expect(screen.getAllByText('U').length).toBeGreaterThan(0);
  });

  it('falls back to a single U when the selected account name contains only whitespace', () => {
    const blankName = { ...user, name: '   ', username: '' };
    instance.getActiveAccount.mockReturnValue(blankName);
    auth.useMsal.mockReturnValue({ instance, accounts: [blankName] });
    render(<ProfileMenu />);
    expect(screen.getByText('U')).toBeInTheDocument();
  });
});

describe('Navigation bar', () => {
  it('shows admin links and navigates from the logo', () => {
    setMsal();
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Navigationbar />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('link', { name: 'Participants' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'My Tasks' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Administration' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Go to dashboard' })).toHaveAttribute('href', '/dashboard');
  });

  it('shows employee navigation but hides administration', () => {
    setMsal({ accounts: [{ ...user, idTokenClaims: { roles: ['Employee'] } }] });
    render(
      <MemoryRouter>
        <Navigationbar />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('link', { name: 'Participants' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'My Tasks' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Administration' })).not.toBeInTheDocument();
  });

  it('shows only common links for attendees and users without roles', () => {
    for (const roles of [['Attendee'], []]) {
      setMsal({ accounts: [{ ...user, idTokenClaims: { roles } }] });
      const { unmount } = render(
        <MemoryRouter>
          <Navigationbar />
        </MemoryRouter>,
      );
      expect(screen.getAllByRole('link', { name: 'Dashboard' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: 'Events' }).length).toBeGreaterThan(0);
      expect(screen.queryByRole('link', { name: 'Participants' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'My Tasks' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Administration' })).not.toBeInTheDocument();
      unmount();
    }
  });

  it('marks each allowed navigation route as active', () => {
    setMsal();
    for (const [path, label] of [
      ['/dashboard', 'Dashboard'],
      ['/events', 'Events'],
      ['/participants', 'Participants'],
      ['/my-tasks', 'My Tasks'],
      ['/administration', 'Administration'],
    ]) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path ?? '/']}>
          <Navigationbar />
        </MemoryRouter>,
      );
      expect(screen.getAllByRole('link', { name: label })[0]).toHaveClass('bg-surface-blue');
      unmount();
    }
  });
});
