import {
  act,
  fireEvent,
  render as rtlRender,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setApiMock, type ApiMock } from './server';
import Administration from '../src/features/administration';
import Dashboard from '../src/features/dashboard';
import Events from '../src/features/events';
import Participants from '../src/features/participants';

const futureEventDate = (hoursAhead: number): string =>
  new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString();

function render(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return rtlRender(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

const mocks = vi.hoisted(() => ({ useMsal: vi.fn() }));
vi.mock('@azure/msal-react', () => ({ useMsal: mocks.useMsal }));
vi.mock('../src/features/dashboard/components/DashboardCalendarPanel', () => ({
  default: (props: Record<string, unknown>) => {
    const call = (handler: unknown, ...args: unknown[]) => {
      if (typeof handler === 'function') (handler as (...values: unknown[]) => void)(...args);
    };
    const formData = props.formData as Record<string, string>;
    const attendeePopup = props.attendeeEventPopup as {
      event: { eventName: string; eventId: number };
    } | null;
    return (
      <div data-testid="dashboard-calendar-harness">
        <button onClick={() => call(props.onCreateEvent)}>Harness create event</button>
        <button
          onClick={() => call(props.onCellClick, { startTime: new Date('2026-10-12T00:00:00') })}
        >
          Harness select date
        </button>
        <button onClick={() => call(props.onCellDoubleClick, {})}>
          Harness double-click empty day
        </button>
        {[1, 2, 999].map((id) => (
          <button
            key={id}
            onClick={(event) => {
              const args: { event: { Id: number }; cancel?: boolean } = { event: { Id: id } };
              call(props.onEventDoubleClick, args);
              event.currentTarget.dataset.cancelled = String(args.cancel);
            }}
          >
            Harness edit {id === 1 ? 'scheduled' : id === 2 ? 'completed' : 'missing'} event
          </button>
        ))}
        <button
          onClick={(event) => {
            const args: { type: string; data: Record<string, unknown>; cancel?: boolean } = {
              type: 'QuickInfo',
              data: {},
            };
            call(props.onPopupOpen, args);
            event.currentTarget.dataset.cancelled = String(args.cancel ?? false);
          }}
        >
          Harness empty quick popup
        </button>
        <button onClick={() => call(props.onPopupOpen, { type: 'Other', data: { Id: 1 } })}>
          Harness other popup
        </button>
        <button onClick={() => call(props.onPopupOpen, { type: 'QuickInfo', data: { Id: 1 } })}>
          Harness event popup
        </button>
        <button onClick={() => call(props.onPopupOpen, { type: 'QuickInfo', data: { Id: 999 } })}>
          Harness missing event popup
        </button>
        <button
          onClick={() =>
            call(props.onRenderCell, {
              type: 'workCells',
              date: new Date('2026-10-12'),
              element: document.createElement('div'),
            })
          }
        >
          Harness render selected cell
        </button>
        <button
          onClick={() =>
            call(props.onRenderCell, {
              type: 'monthCells',
              date: new Date('2026-10-12'),
              element: document.createElement('div'),
            })
          }
        >
          Harness render other cell
        </button>
        {(['Completed', 'Scheduled', 'Scheduled'] as const).map((status, index) => (
          <button
            key={`${status}-${index}`}
            onClick={(event) => {
              const element = document.createElement('div');
              const data = {
                Status: status,
                ...(index === 1 ? { isRegistrationCancelled: true } : {}),
              };
              call(props.onEventRendered, { data, element });
              event.currentTarget.dataset.color = element.style.backgroundColor || 'unchanged';
            }}
          >
            Harness render{' '}
            {index === 0
              ? 'completed event'
              : index === 1
                ? 'cancelled registration'
                : 'scheduled event'}
          </button>
        ))}
        <button
          onClick={(event) => {
            const element = document.createElement('div');
            call(props.onRenderCell, { type: 'workCells', date: new Date('2026-10-12'), element });
            event.currentTarget.dataset.color = element.style.backgroundColor || 'unchanged';
          }}
        >
          Harness render selected cell and inspect
        </button>
        {props.showEventForm === true && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const values = Object.fromEntries(new FormData(event.currentTarget).entries());
              call(props.onSaveEvent, values);
            }}
          >
            {(
              [
                'eventName',
                'startDate',
                'endDate',
                'venueId',
                'orgId',
                'budget',
                'eventType',
              ] as const
            ).map((field) => (
              <input
                key={field}
                name={field}
                aria-label={`Harness ${{ eventName: 'event name', startDate: 'event start', endDate: 'event end', venueId: 'venue', orgId: 'organization', budget: 'budget', eventType: 'event type' }[field]}`}
                defaultValue={formData[field]}
              />
            ))}
            <button type="submit">Harness save event</button>
            <button type="button" onClick={() => call(props.onCloseEventForm)}>
              Harness close form
            </button>
          </form>
        )}
        <span data-testid="calendar-month-count">{String(props.monthEventCount)}</span>
        <span data-testid="calendar-selected-date">
          {(props.selectedDate as Date | null)?.toISOString() ?? 'none'}
        </span>
        {attendeePopup && (
          <div data-testid="attendee-popup">
            {attendeePopup.event.eventName}
            <button onClick={() => call(props.onCloseAttendeePopup)}>Close attendee details</button>
            <button onClick={() => call(props.onReregister, attendeePopup.event.eventId)}>
              Harness re-register
            </button>
          </div>
        )}
      </div>
    );
  },
}));

const account = {
  homeAccountId: 'test-account',
  name: 'Ananya Urlam',
  username: 'ananya@example.com',
  idTokenClaims: { roles: ['Admin', 'Employee'] },
};

function apiResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

function setAccount(roles: string[] = ['Admin', 'Employee']) {
  const user = { ...account, idTokenClaims: { roles } };
  mocks.useMsal.mockReturnValue({
    accounts: [user],
    instance: {
      getActiveAccount: () => user,
      acquireTokenSilent: vi.fn(async () => ({ accessToken: 'test-token' })),
      loginRedirect: vi.fn(),
      setActiveAccount: vi.fn(),
      logoutRedirect: vi.fn(),
    },
    inProgress: 'none',
  });
}

beforeEach(() => {
  setAccount();
  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/api/events/my-registrations')) return apiResponse([]);
    if (url.includes('/api/events') && url.includes('/attendees')) return apiResponse([]);
    if (url.includes('/api/events')) return apiResponse([]);
    if (url.includes('/api/attendees')) return apiResponse([]);
    if (url.includes('/api/venues')) return apiResponse([]);
    if (url.includes('/api/organizations')) return apiResponse([]);
    if (url.includes('/api/employees')) return apiResponse([]);
    if (url.includes('/api/staff')) return apiResponse([]);
    return apiResponse([]);
  });
  setApiMock(fetchMock as unknown as ApiMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('Dashboard page', () => {
  it('loads event counts and dropdown data, and keeps only welcome copy above the dashboard', async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/events') {
        return apiResponse([
          {
            eventId: 1,
            eventName: 'Upcoming Expo',
            startDate: future,
            endDate: future,
            status: 'Scheduled',
            eventType: 0,
          },
          {
            eventId: 2,
            eventName: 'Cancelled Expo',
            startDate: future,
            endDate: future,
            status: 'Cancelled',
            eventType: 0,
          },
        ]);
      }
      if (url === '/api/venues') return apiResponse([{ venueId: 3, address: 'Main Hall' }]);
      if (url === '/api/organizations') return apiResponse([{ orgId: 4, name: 'WinWire' }]);
      return apiResponse([]);
    });

    render(<Dashboard />);
    expect(
      await screen.findByText("Welcome back! Here's what's happening with your events."),
    ).toBeInTheDocument();
    expect(screen.getByText('Welcome, Ananya Urlam')).toBeInTheDocument();
    expect(screen.queryByText('WINEVENTS')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument();
    expect(await screen.findByText('Upcoming Expo')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/venues');
    expect(fetchMock).toHaveBeenCalledWith('/api/organizations');
  });

  it('loads attendee registrations with an access token and handles a failed dropdown request', async () => {
    setAccount(['Attendee']);
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/events/my-registrations') return apiResponse([]);
      if (url === '/api/venues') return apiResponse([], false, 500);
      if (url === '/api/organizations') return apiResponse([]);
      return apiResponse([]);
    });
    render(<Dashboard />);
    expect(await screen.findByText(/Failed to load venues/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/events/my-registrations',
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss error' }));
    await waitFor(() =>
      expect(screen.queryByText(/Failed to load venues/)).not.toBeInTheDocument(),
    );
  });

  it('uses a fallback greeting and surfaces event and malformed dropdown responses', async () => {
    mocks.useMsal.mockReturnValue({ accounts: [], instance: { getActiveAccount: () => null } });
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/events') return apiResponse('event service unavailable', false, 503);
      if (url === '/api/venues') return apiResponse([]);
      if (url === '/api/organizations') return apiResponse([]);
      return apiResponse([]);
    });
    const { unmount } = render(<Dashboard />);
    expect(screen.getByText('Welcome, User')).toBeInTheDocument();
    expect(await screen.findByText(/Failed to load events \(503\)/)).toBeInTheDocument();
    unmount();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) =>
      String(input) === '/api/venues' ? apiResponse({ venues: [] }) : apiResponse([]),
    );
    render(<Dashboard />);
    expect(await screen.findByText('The venues API did not return a list.')).toBeInTheDocument();
  });

  it('maps numeric calendar event statuses to cancelled, completed, and scheduled states', async () => {
    const start = new Date(Date.now() + 2 * 86_400_000).toISOString();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) =>
      String(input) === '/api/events'
        ? apiResponse(
            [1, 2, 0].map((status, index) => ({
              eventId: 30 + index,
              eventName: `Numeric Status ${status}`,
              startDate: start,
              endDate: start,
              status,
              eventType: 0,
            })),
          )
        : apiResponse([]),
    );
    render(<Dashboard />);
    expect(await screen.findByText('Numeric Status 0')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/events');
  });

  it('normalizes alternate dashboard venue and organization ID/name fields', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/venues')
        return apiResponse([
          { venueId: '5', Address: 'Alternate Hall' },
          { venueId: 'invalid', name: 'Rejected venue' },
        ]);
      if (url === '/api/organizations')
        return apiResponse([
          { OrganizationId: '6', OrganizationName: 'Alternate Org' },
          { id: 0, name: '' },
        ]);
      return apiResponse([]);
    });
    render(<Dashboard />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/venues'));
    expect(fetchMock).toHaveBeenCalledWith('/api/organizations');
  });

  it('opens and dismisses attendee calendar details while blocking blank quick info', async () => {
    setAccount(['Attendee']);
    const event = {
      eventId: 1,
      eventName: 'Attendee Gala',
      startDate: futureEventDate(1),
      endDate: futureEventDate(2),
      status: 0,
      eventType: 0,
      venueId: 3,
    };
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/events/my-registrations') return apiResponse([event]);
      if (url === '/api/venues') return apiResponse([{ venueId: 3, address: 'Main Hall' }]);
      if (url === '/api/organizations') return apiResponse([]);
      return apiResponse([]);
    });
    render(<Dashboard />);
    await screen.findByText('Attendee Gala');
    fireEvent.click(screen.getByRole('button', { name: 'Harness create event' }));
    fireEvent.click(screen.getByRole('button', { name: 'Harness edit scheduled event' }));
    expect(screen.queryByRole('button', { name: 'Harness save event' })).not.toBeInTheDocument();
    const emptyPopup = screen.getByRole('button', { name: 'Harness empty quick popup' });
    fireEvent.click(emptyPopup);
    expect(emptyPopup).toHaveAttribute('data-cancelled', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Harness event popup' }));
    expect(screen.getByTestId('attendee-popup')).toHaveTextContent('Attendee Gala');
    fireEvent.click(screen.getByRole('button', { name: 'Close attendee details' }));
    expect(screen.queryByTestId('attendee-popup')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Harness missing event popup' }));
    expect(screen.queryByTestId('attendee-popup')).not.toBeInTheDocument();
  });

  it('re-registers a cancelled attendee event from its calendar popup', async () => {
    setAccount(['Attendee']);
    const event = {
      eventId: 1,
      eventName: 'Attendee Gala',
      startDate: futureEventDate(1),
      endDate: futureEventDate(2),
      status: 0,
      eventType: 0,
      venueId: 3,
      isRegistrationCancelled: true,
    };
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/events/my-registrations') return apiResponse([event]);
      if (url === '/api/venues') return apiResponse([{ venueId: 3, address: 'Main Hall' }]);
      if (url === '/api/organizations') return apiResponse([]);
      if (url === '/api/events/1/register' && init?.method === 'POST')
        return apiResponse({ eventId: 1 });
      return apiResponse([]);
    });

    render(<Dashboard />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Harness event popup' }));
      expect(screen.getByTestId('attendee-popup')).toHaveTextContent('Attendee Gala');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Harness re-register' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/events/1/register', expect.anything()),
    );
    await waitFor(() => expect(screen.queryByTestId('attendee-popup')).not.toBeInTheDocument());
  });

  it('adds the manager cancel action to the calendar popup and only cancels after confirmation', async () => {
    const event = {
      eventId: 1,
      eventName: 'Cancel from Calendar',
      startDate: futureEventDate(1),
      endDate: futureEventDate(2),
      status: 0,
      eventType: 0,
      venueId: 3,
    };
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/events/1/cancel' && init?.method === 'PATCH') return apiResponse({});
      if (url === '/api/events') return apiResponse([event]);
      if (url === '/api/venues' || url === '/api/organizations') return apiResponse([]);
      return apiResponse([]);
    });
    const popup = document.createElement('div');
    popup.className = 'e-quick-popup-wrapper';
    popup.innerHTML =
      '<div class="e-footer-content"><button class="e-event-edit">Edit</button><button class="e-event-delete">Delete</button></div>';
    document.body.appendChild(popup);
    const confirm = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const { unmount } = render(<Dashboard />);
    await screen.findByText('Cancel from Calendar');
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Harness event popup' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(popup.querySelector('.e-event-edit')).toBeNull();
    expect(popup.querySelector('.e-event-delete')).toBeNull();
    const cancelButton = within(popup).getByRole('button', { name: 'Cancel Event' });
    fireEvent.click(cancelButton);
    expect(confirm).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalledWith('/api/events/1/cancel', expect.anything());
    fireEvent.click(cancelButton);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/events/1/cancel',
      expect.objectContaining({ method: 'PATCH' }),
    );
    unmount();
    popup.remove();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('selects dates, validates event input, creates an event, and exercises edit guards', async () => {
    const scheduled = {
      eventId: 1,
      eventName: 'Scheduled One',
      startDate: futureEventDate(1),
      endDate: futureEventDate(2),
      status: 0,
      eventType: 0,
      venueId: 3,
      orgId: 4,
      budget: 10,
    };
    const completed = { ...scheduled, eventId: 2, eventName: 'Completed One', status: 'Completed' };
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/events' && init?.method === 'POST') return apiResponse({ eventId: 3 });
      if (url === '/api/events') return apiResponse([scheduled, completed]);
      if (url === '/api/venues') return apiResponse([{ venueId: 3, address: 'Main Hall' }]);
      if (url === '/api/organizations') return apiResponse([{ orgId: 4, name: 'WinWire' }]);
      return apiResponse([]);
    });
    render(<Dashboard />);
    await screen.findByText('Scheduled One');
    fireEvent.click(screen.getByRole('button', { name: 'Harness edit scheduled event' }));
    expect(screen.getByRole('button', { name: 'Harness edit scheduled event' })).toHaveAttribute(
      'data-cancelled',
      'true',
    );
    expect(screen.getByLabelText(/Harness event name/)).toHaveValue('Scheduled One');
    fireEvent.click(screen.getByRole('button', { name: 'Harness close form' }));
    fireEvent.click(screen.getByRole('button', { name: 'Harness edit completed event' }));
    expect(screen.getByRole('button', { name: 'Harness edit completed event' })).toHaveAttribute(
      'data-cancelled',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Harness edit missing event' }));
    expect(screen.getByRole('button', { name: 'Harness edit missing event' })).toHaveAttribute(
      'data-cancelled',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Harness render completed event' }));
    expect(screen.getByRole('button', { name: 'Harness render completed event' })).toHaveAttribute(
      'data-color',
      'var(--color-surface-lavender-light)',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Harness render cancelled registration' }));
    expect(
      screen.getByRole('button', { name: 'Harness render cancelled registration' }),
    ).toHaveAttribute('data-color', 'var(--color-surface-orange-light)');
    fireEvent.click(screen.getByRole('button', { name: 'Harness render scheduled event' }));
    expect(screen.getByRole('button', { name: 'Harness render scheduled event' })).toHaveAttribute(
      'data-color',
      'unchanged',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Harness other popup' }));
    fireEvent.click(screen.getByRole('button', { name: 'Harness select date' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Harness render selected cell and inspect' }),
    );
    expect(
      screen.getByRole('button', { name: 'Harness render selected cell and inspect' }),
    ).toHaveAttribute('data-color', 'var(--color-surface-lavender)');
    expect(screen.getByTestId('calendar-selected-date')).toHaveTextContent(
      new Date('2026-10-12T00:00:00').toISOString(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Harness double-click empty day' }));
    fireEvent.click(screen.getByRole('button', { name: 'Harness create event' }));
    fireEvent.change(screen.getByLabelText(/Harness event name/), {
      target: { value: 'New Showcase' },
    });
    fireEvent.change(screen.getByLabelText(/Harness event start/), {
      target: { value: '2026-11-01T10:00' },
    });
    fireEvent.change(screen.getByLabelText(/Harness event end/), {
      target: { value: '2026-11-01T11:00' },
    });
    fireEvent.change(screen.getByLabelText(/Harness venue/), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/Harness event type/), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Harness event end/), {
      target: { value: '2026-11-01T11:00' },
    });
    fireEvent.change(screen.getByLabelText(/Harness organization/), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText(/Harness budget/), { target: { value: '10' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Harness save event' }).closest('form')!);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/events',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    expect(
      JSON.parse(
        String(
          fetchMock.mock.calls.find(
            ([url, init]) => url === '/api/events' && init?.method === 'POST',
          )?.[1]?.body,
        ),
      ),
    ).toMatchObject({
      eventName: 'New Showcase',
      venueId: 3,
      orgId: 4,
      budget: 10,
      eventType: 2,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Harness edit scheduled event' }));
    expect(screen.getByLabelText(/Harness event name/)).toHaveValue('Scheduled One');
    fireEvent.click(screen.getByRole('button', { name: 'Harness close form' }));
  });
});

describe('Administration page', () => {
  it('loads organizations and switches between organization, employee, and venue sections', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/organizations'))
        return apiResponse([
          {
            orgId: 1,
            name: 'WinWire',
            email: 'hello@example.com',
            phone: '123',
            contactPerson: 'Alex',
          },
        ]);
      if (url.endsWith('/api/employees'))
        return apiResponse([
          {
            employeeId: 2,
            name: 'Jordan',
            jobTitle: 'Coordinator',
            email: 'jordan@example.com',
            orgId: 1,
          },
        ]);
      if (url.endsWith('/api/venues'))
        return apiResponse([{ venueId: 3, address: 'Main Hall', capacity: 100 }]);
      return apiResponse([]);
    });
    render(<Administration />);
    expect(await screen.findByText('WinWire')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Employees' }));
    expect(await screen.findByText('Jordan')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Venues' }));
    expect((await screen.findAllByText('Main Hall')).length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledWith('/api/organizations', expect.anything());
    expect(fetchMock).toHaveBeenCalledWith('/api/employees', expect.anything());
    expect(fetchMock).toHaveBeenCalledWith('/api/venues');
  });

  it('shows the organization API error and supports an empty account state', async () => {
    fetchMock.mockImplementation(async () => apiResponse('database unavailable', false, 500));
    const { unmount } = render(<Administration />);
    expect(await screen.findByText(/Failed to load organizations/)).toBeInTheDocument();
    mocks.useMsal.mockReturnValue({
      accounts: [],
      instance: { getActiveAccount: () => null, acquireTokenSilent: vi.fn() },
    });
    unmount();
    render(<Administration />);
    expect(await screen.findByText(/No Microsoft account/)).toBeInTheDocument();
  });

  it('creates, edits, and deletes an organization through the page actions', async () => {
    const organization = {
      orgId: 1,
      name: 'WinWire',
      email: 'hello@example.com',
      phone: '123',
      contactPerson: 'Alex',
    };
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/organizations' && init?.method === 'POST') return apiResponse({});
      if (url === '/api/organizations/1' && init?.method === 'PUT') return apiResponse({});
      if (url === '/api/organizations/1' && init?.method === 'DELETE') return apiResponse({});
      if (url === '/api/organizations') return apiResponse([organization]);
      return apiResponse([]);
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Administration />);
    await screen.findByText('WinWire');
    fireEvent.click(screen.getByRole('button', { name: '+ Add Organization' }));
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'New Org' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/), { target: { value: '456' } });
    fireEvent.submit(screen.getByRole('heading', { name: 'Add Organization' }).closest('form')!);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/organizations',
        expect.objectContaining({ method: 'POST' }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('heading', { name: 'Edit Organization' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Updated Org' } });
    fireEvent.submit(screen.getByRole('heading', { name: 'Edit Organization' }).closest('form')!);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/organizations/1',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/organizations/1',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
    expect(window.confirm).toHaveBeenCalled();
  });

  it('creates employee and venue records and filters their tables', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/employees' && init?.method === 'POST') return apiResponse({});
      if (url === '/api/employees/2' && init?.method === 'PUT') return apiResponse({});
      if (url === '/api/employees/2' && init?.method === 'DELETE') return apiResponse({});
      if (url === '/api/venues' && init?.method === 'POST') return apiResponse({});
      if (url.endsWith('/api/organizations'))
        return apiResponse([
          { orgId: 1, name: 'WinWire', email: '', phone: '', contactPerson: '' },
        ]);
      if (url.endsWith('/api/employees'))
        return apiResponse([
          {
            employeeId: 2,
            name: 'Jordan',
            jobTitle: 'Coordinator',
            email: 'jordan@example.com',
            orgId: 1,
          },
        ]);
      if (url.endsWith('/api/venues'))
        return apiResponse([{ venueId: 3, address: 'Main Hall', capacity: 100 }]);
      return apiResponse([]);
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Administration />);
    await screen.findByText('WinWire');
    fireEvent.click(screen.getByRole('button', { name: 'Employees' }));
    await screen.findByText('Jordan');
    fireEvent.click(screen.getByRole('button', { name: '+ Add Employee' }));
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Taylor' } });
    fireEvent.change(screen.getByLabelText(/Job Title/), { target: { value: 'Planner' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'taylor@example.com' } });
    fireEvent.change(screen.getByLabelText(/Organization/), { target: { value: '1' } });
    fireEvent.submit(screen.getByRole('heading', { name: 'Add Employee' }).closest('form')!);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/employees',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('heading', { name: 'Edit Employee' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Jordan Updated' } });
    fireEvent.submit(screen.getByRole('heading', { name: 'Edit Employee' }).closest('form')!);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/employees/2',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/employees/2',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
    fireEvent.change(screen.getByPlaceholderText('Search employees...'), {
      target: { value: 'missing' },
    });
    expect(screen.getByText('No matching employees')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Venues' }));
    await screen.findAllByText('Main Hall');
    fireEvent.click(screen.getByRole('button', { name: '+ Add Venue' }));
    fireEvent.change(screen.getByLabelText(/Address/), { target: { value: 'West Hall' } });
    fireEvent.change(screen.getByLabelText(/Capacity/), { target: { value: '250' } });
    fireEvent.submit(screen.getByRole('heading', { name: 'Add Venue' }).closest('form')!);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/venues',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    fireEvent.change(screen.getByPlaceholderText('Search venues...'), {
      target: { value: 'missing' },
    });
    expect(screen.getByText('No matching venues')).toBeInTheDocument();
  });

  it('shows employee and venue loading errors and supports cancelling their forms', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/employees'))
        return apiResponse('employee service unavailable', false, 503);
      if (url.endsWith('/api/venues')) return apiResponse('venue service unavailable', false, 503);
      if (url.endsWith('/api/organizations')) return apiResponse([]);
      return apiResponse([]);
    });
    render(<Administration />);
    await screen.findByText('No organizations found');
    fireEvent.click(screen.getByRole('button', { name: 'Employees' }));
    expect(await screen.findByText('Failed to load employees (503)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Venues' }));
    expect(await screen.findByText('Failed to load venues (503)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '+ Add Venue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close add venue dialog' }));
    expect(screen.queryByRole('heading', { name: 'Add Venue' })).not.toBeInTheDocument();
  });

  it('displays organization save/delete errors and honors a declined delete confirmation', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/organizations' && init?.method === 'POST')
        return apiResponse('organization save failed', false, 400);
      if (url === '/api/organizations/1' && init?.method === 'DELETE')
        return apiResponse('organization delete failed', false, 409);
      if (url === '/api/organizations')
        return apiResponse([
          {
            orgId: 1,
            name: 'WinWire',
            email: 'hello@example.com',
            phone: '123',
            contactPerson: 'Alex',
          },
        ]);
      return apiResponse([]);
    });
    const confirm = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    render(<Administration />);
    await screen.findByText('WinWire');
    fireEvent.click(screen.getByRole('button', { name: '+ Add Organization' }));
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'New Org' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/), { target: { value: '456' } });
    fireEvent.submit(screen.getByRole('heading', { name: 'Add Organization' }).closest('form')!);
    expect(await screen.findByText('organization save failed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/organizations/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('organization delete failed')).toBeInTheDocument();
  });

  it('uses fallback errors for employee and venue save/delete failures', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (
        (url === '/api/employees' || url === '/api/employees/2') &&
        ['POST', 'PUT', 'DELETE'].includes(init?.method ?? '')
      )
        return apiResponse('', false, 500);
      if (url === '/api/venues' && init?.method === 'POST') return apiResponse('', false, 500);
      if (url === '/api/employees')
        return apiResponse([
          {
            employeeId: 2,
            name: 'Jordan',
            jobTitle: 'Coordinator',
            email: 'jordan@example.com',
            orgId: 1,
          },
        ]);
      if (url === '/api/organizations') return apiResponse([{ orgId: 1, name: 'WinWire' }]);
      return apiResponse([]);
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Administration />);
    await screen.findByText('WinWire');
    fireEvent.click(screen.getByRole('button', { name: 'Employees' }));
    await screen.findByText('Jordan');
    fireEvent.click(screen.getByRole('button', { name: '+ Add Employee' }));
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Taylor' } });
    fireEvent.change(screen.getByLabelText(/Job Title/), { target: { value: 'Planner' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'taylor@example.com' } });
    fireEvent.submit(screen.getByRole('heading', { name: 'Add Employee' }).closest('form')!);
    expect(await screen.findByText('Failed to create employee (500)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Failed to delete employee (500)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Venues' }));
    fireEvent.click(screen.getByRole('button', { name: '+ Add Venue' }));
    fireEvent.change(screen.getByLabelText(/Address/), { target: { value: 'West Hall' } });
    fireEvent.change(screen.getByLabelText(/Capacity/), { target: { value: '250' } });
    fireEvent.submit(screen.getByRole('heading', { name: 'Add Venue' }).closest('form')!);
    expect(await screen.findByText('Failed to create venue (500)')).toBeInTheDocument();
  });
});

describe('Participants page', () => {
  it('loads events and participants and filters the registration table', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/events'))
        return apiResponse([{ eventId: 8, eventName: 'Summer Festival' }]);
      if (url.endsWith('/api/attendees'))
        return apiResponse([
          {
            attendeeId: 5,
            name: 'Jordan',
            email: 'jordan@example.com',
            phone: '555',
            ticket: 'VIP',
          },
        ]);
      if (url.endsWith('/api/events/8/attendees'))
        return apiResponse([
          {
            attendeeId: 5,
            name: 'Jordan',
            email: 'jordan@example.com',
            eventId: 8,
            registeredAt: '2026-10-01',
          },
        ]);
      return apiResponse([]);
    });
    render(<Participants />);
    expect(await screen.findByText('Jordan')).toBeInTheDocument();
    expect(screen.getAllByText('Summer Festival').length).toBeGreaterThan(0);
    fireEvent.change(screen.getAllByRole('combobox')[0]!, { target: { value: '8' } });
    expect(screen.getByText('Jordan')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/events/8/attendees', expect.anything());
  });

  it('displays an error when event loading fails', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) =>
      String(input).endsWith('/api/events') ? apiResponse('error', false, 500) : apiResponse([]),
    );
    render(<Participants />);
    expect((await screen.findAllByText(/Failed to load events/)).length).toBeGreaterThan(0);
  });

  it('validates participant event selection, creates the attendee and registration, then removes the registration', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/events'))
        return apiResponse([{ eventId: 8, eventName: 'Summer Festival' }]);
      if (url === '/api/attendees' && init?.method === 'POST')
        return apiResponse({
          attendeeId: 16,
          name: 'Taylor',
          email: 'taylor@example.com',
          phone: '555-0100',
          ticket: 'VIP',
        });
      if (url.endsWith('/api/attendees')) return apiResponse([]);
      if (url.endsWith('/api/events/8/attendees') && !init?.method) return apiResponse([]);
      if (url === '/api/events/8/attendees/16' && init?.method === 'POST') return apiResponse({});
      if (url === '/api/events/8/attendees/16' && init?.method === 'DELETE') return apiResponse({});
      return apiResponse([]);
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Participants />);
    await screen.findByText('Summer Festival');
    fireEvent.click(screen.getByRole('button', { name: '+ Add Participant' }));
    const form = () => screen.getByRole('heading', { name: 'Add Participant' }).closest('form')!;
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Taylor' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'taylor@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/), { target: { value: '555-0100' } });
    fireEvent.change(screen.getByLabelText(/Ticket/), { target: { value: 'VIP' } });
    fireEvent.submit(form());
    expect((await screen.findAllByText('Please select an event.')).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText(/Event/), { target: { value: '8' } });
    fireEvent.submit(form());
    await screen.findByText('Taylor');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/attendees',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/events/8/attendees/16',
      expect.objectContaining({ method: 'POST' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove Taylor from Summer Festival' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/events/8/attendees/16',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
    expect(window.confirm).toHaveBeenCalled();
  });

  it('reports a registration failure after creating a new attendee', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/events'))
        return apiResponse([{ eventId: 8, eventName: 'Summer Festival' }]);
      if (url.endsWith('/api/attendees') && init?.method === 'POST')
        return apiResponse({ attendeeId: 16, name: 'Taylor', email: 'taylor@example.com' });
      if (url.endsWith('/api/events/8/attendees') && !init?.method) return apiResponse([]);
      if (url === '/api/attendees') return apiResponse([]);
      if (url.endsWith('/api/events/8/attendees/16'))
        return apiResponse('registration unavailable', false, 503);
      return apiResponse([]);
    });
    render(<Participants />);
    await screen.findByText('Summer Festival');
    fireEvent.click(screen.getByRole('button', { name: '+ Add Participant' }));
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Taylor' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'taylor@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/), { target: { value: '555-0100' } });
    fireEvent.change(screen.getByLabelText(/Ticket/), { target: { value: 'VIP' } });
    fireEvent.change(screen.getByLabelText(/Event/), { target: { value: '8' } });
    fireEvent.submit(screen.getByRole('heading', { name: 'Add Participant' }).closest('form')!);
    expect((await screen.findAllByText('registration unavailable')).length).toBeGreaterThan(0);
  });
});

describe('Events page', () => {
  it('loads manager events, opens the create form, and cancels it', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/events')
        return apiResponse([{ ...eventRecord, eventId: 11, eventName: 'Town Hall' }]);
      if (url.endsWith('/api/venues'))
        return apiResponse([{ venueId: 1, address: 'Main Hall', capacity: 200 }]);
      if (url.endsWith('/api/organizations'))
        return apiResponse([
          { orgId: 2, name: 'WinWire', email: '', phone: '', contactPerson: '' },
        ]);
      if (url.endsWith('/api/employees'))
        return apiResponse([
          { employeeId: 3, name: 'Jordan', jobTitle: 'Coordinator', email: '', orgId: 2 },
        ]);
      return apiResponse([]);
    });
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Town Hall')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Create Event|Add Event/i }));
    expect(await screen.findByRole('heading', { name: 'Create Event' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close create event dialog' }));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Create Event' })).not.toBeInTheDocument(),
    );
  });

  it('handles event loading failures and attendee registration states', async () => {
    setAccount(['Attendee']);
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/events') return apiResponse([], false, 500);
      return apiResponse([]);
    });
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>,
    );
    expect((await screen.findAllByText(/Failed to load events/)).length).toBeGreaterThan(0);
  });

  it('validates and creates an event with local times converted for the API', async () => {
    const created = { ...eventRecord, eventId: 35, eventName: 'Created Meetup', status: 0 };
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/events' && init?.method === 'POST') return apiResponse(created);
      if (url.startsWith('/api/events')) return apiResponse([]);
      if (url.endsWith('/api/venues'))
        return apiResponse([{ venueId: 1, address: 'Main Hall', capacity: 200 }]);
      if (url.endsWith('/api/organizations')) return apiResponse([{ orgId: 2, name: 'WinWire' }]);
      if (url.endsWith('/api/employees')) return apiResponse([]);
      return apiResponse([]);
    });
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>,
    );
    await screen.findByText('No events found');
    fireEvent.click(screen.getByRole('button', { name: /Create Event/i }));
    const form = () => document.querySelector('form')!;
    fireEvent.submit(form());
    expect(await screen.findByText('Event name is required.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Event Name/), { target: { value: 'Created Meetup' } });
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '09:30' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '08:30' } });
    fireEvent.submit(form());
    expect(await screen.findByText('Please select a venue.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Venue/), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Event Type/), { target: { value: '2' } });
    fireEvent.submit(form());
    expect(await screen.findByText('End date must be after the start date.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '11:30' } });
    fireEvent.change(screen.getByLabelText(/Budget/), { target: { value: '125.50' } });
    fireEvent.change(screen.getByLabelText(/Organization/), { target: { value: '2' } });
    fireEvent.submit(form());
    expect(await screen.findByText('Event created successfully.')).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(
      ([url, init]) => url === '/api/events' && init?.method === 'POST',
    );
    expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({
      eventName: 'Created Meetup',
      venueId: 1,
      eventType: 2,
      orgId: 2,
      budget: 125.5,
      startDate: new Date('2026-11-01T09:30').toISOString(),
    });
  });

  it('opens task assignment, validates fields, assigns the task, and reloads assigned staff', async () => {
    const record = { ...eventRecord, eventId: 44, eventName: 'Town Hall', status: 0 };
    const assignment = {
      assignmentId: 6,
      name: 'Jordan',
      jobTitle: 'Coordinator',
      task: 'Prepare room',
      deadline: null,
      status: 'Pending',
    };
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/events') return apiResponse([record]);
      if (url === '/api/events/44/staff' && init?.method === 'POST') return apiResponse({});
      if (url === '/api/events/44/staff') return apiResponse([assignment]);
      if (url.endsWith('/api/venues')) return apiResponse([]);
      if (url.endsWith('/api/organizations')) return apiResponse([]);
      if (url.endsWith('/api/employees'))
        return apiResponse([{ employeeId: 8, name: 'Jordan', jobTitle: 'Coordinator' }]);
      return apiResponse([]);
    });
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>,
    );
    await screen.findByText('Town Hall');
    fireEvent.click(screen.getByRole('button', { name: 'Assign Task' }));
    expect(
      await screen.findByRole('heading', { name: 'Assign Employee Task' }),
    ).toBeInTheDocument();
    const assignmentPanel = () =>
      screen.getByRole('heading', { name: 'Assign Employee Task' }).closest('section')!;
    fireEvent.change(screen.getByLabelText(/Employee/), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText(/Task/), { target: { value: 'Prepare room' } });
    fireEvent.change(screen.getByLabelText(/Deadline/), { target: { value: '2026-11-01T09:30' } });
    fireEvent.click(within(assignmentPanel()).getByRole('button', { name: 'Assign Task' }));
    expect(
      (await screen.findAllByText('Employee task assigned successfully.')).length,
    ).toBeGreaterThan(0);
    expect(await screen.findByText('Prepare room')).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(
      ([url, init]) => url === '/api/events/44/staff' && init?.method === 'POST',
    );
    expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({
      employeeId: 8,
      task: 'Prepare room',
      deadline: new Date('2026-11-01T09:30').toISOString(),
    });
  });

  it('does not cancel without confirmation and handles a failed confirmed cancellation', async () => {
    const record = { ...eventRecord, eventId: 45, eventName: 'Cancel Test', status: 0 };
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/events') return apiResponse([record]);
      if (url.endsWith('/api/events/45/cancel') && init?.method === 'PATCH')
        return apiResponse('cancellation denied', false, 409);
      if (
        url.endsWith('/api/venues') ||
        url.endsWith('/api/organizations') ||
        url.endsWith('/api/employees')
      )
        return apiResponse([]);
      return apiResponse([]);
    });
    const confirm = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>,
    );
    await screen.findByText('Cancel Test');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalledWith('/api/events/45/cancel', expect.anything());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect((await screen.findAllByText('cancellation denied')).length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/events/45/cancel',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('lets attendees register and replaces the action with Registered', async () => {
    setAccount(['Attendee']);
    const record = { ...eventRecord, eventId: 46, eventName: 'Public Workshop', status: 0 };
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/events') return apiResponse([record]);
      if (url === '/api/events/my-registrations') return apiResponse([]);
      if (url === '/api/events/46/register' && init?.method === 'POST') return apiResponse({});
      return apiResponse([]);
    });
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>,
    );
    await screen.findByText('Public Workshop');
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(
      await screen.findByText('You have successfully registered for the event.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Registered')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/events/46/register',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('filters scheduled, completed, cancelled, and all event statuses', async () => {
    const records = [
      { ...eventRecord, eventId: 51, eventName: 'Scheduled Filter', status: 0 },
      { ...eventRecord, eventId: 52, eventName: 'Completed Filter', status: 2 },
      { ...eventRecord, eventId: 53, eventName: 'Cancelled Filter', status: 1 },
    ];
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/events')) return apiResponse(records);
      return apiResponse([]);
    });
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>,
    );
    await screen.findByText('Scheduled Filter');
    expect(screen.queryByText('Completed Filter')).not.toBeInTheDocument();
    const statusFilter = screen.getByRole('combobox');
    fireEvent.change(statusFilter, { target: { value: 'all' } });
    expect(await screen.findByText('Completed Filter')).toBeInTheDocument();
    expect(screen.getByText('Cancelled Filter')).toBeInTheDocument();
    fireEvent.change(statusFilter, { target: { value: 'completed' } });
    expect(await screen.findByText('Completed Filter')).toBeInTheDocument();
    expect(screen.queryByText('Scheduled Filter')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => url === '/api/events')).toBe(true);
    fireEvent.change(statusFilter, { target: { value: 'cancelled' } });
    expect(await screen.findByText('Cancelled Filter')).toBeInTheDocument();
    expect(screen.queryByText('Completed Filter')).not.toBeInTheDocument();
  });

  it('shows only attendee-registered events in the cancelled filter', async () => {
    setAccount(['Attendee']);
    const registeredCancelled = {
      ...eventRecord,
      eventId: 120,
      eventName: 'Registered cancelled event',
      status: 1,
      isRegistrationCancelled: false,
    };
    const unrelatedCancelled = {
      ...eventRecord,
      eventId: 121,
      eventName: 'Unrelated cancelled event',
      status: 1,
      isRegistrationCancelled: false,
    };
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/events') return apiResponse([registeredCancelled, unrelatedCancelled]);
      if (url === '/api/events/my-registrations') return apiResponse([registeredCancelled]);
      return apiResponse([]);
    });
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>,
    );
    await screen.findByRole('combobox');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'cancelled' } });
    expect(await screen.findByText('Registered cancelled event')).toBeInTheDocument();
    expect(screen.queryByText('Unrelated cancelled event')).not.toBeInTheDocument();
  });
  it('renders every event type and falls back for unknown event types and statuses', async () => {
    const records = Array.from({ length: 7 }, (_, eventType) => ({
      ...eventRecord,
      eventId: 80 + eventType,
      eventName: `Type ${eventType}`,
      eventType: eventType === 6 ? 99 : eventType,
      status: eventType < 3 ? eventType : 99,
    }));
    fetchMock.mockImplementation(async (input: RequestInfo | URL) =>
      String(input).startsWith('/api/events') ? apiResponse(records) : apiResponse([]),
    );
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>,
    );
    await screen.findByText('Type 0');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'all' } });
    for (const eventType of [
      'Conference',
      'Workshop',
      'Webinar',
      'Cultural Fest',
      'Meeting',
      'Product Launch',
      'Unknown',
    ]) {
      expect(await screen.findByText(eventType)).toBeInTheDocument();
    }
    expect(screen.getAllByText('Cancelled').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0);
  });

  it('opens a dashboard create link with a valid selected date and ignores it for attendees', async () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    fetchMock.mockImplementation(async () => apiResponse([]));
    const { unmount } = render(
      <MemoryRouter initialEntries={['/events?create=true&date=2026-11-03']}>
        <Events />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Create Event' })).toBeInTheDocument();
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-11-03');
    expect(screen.getByLabelText('Start time')).toHaveValue('09:00');
    expect(screen.getByLabelText('End date')).toHaveValue('2026-11-03');
    expect(screen.getByLabelText('End time')).toHaveValue('10:00');
    unmount();

    setAccount(['Attendee']);
    render(
      <MemoryRouter initialEntries={['/events?create=true&date=invalid']}>
        <Events />
      </MemoryRouter>,
    );
    await screen.findByText('No events found');
    expect(screen.queryByRole('heading', { name: 'Create Event' })).not.toBeInTheDocument();
  });

  it('reports invalid event routes and displays the API fallback when event details fail to load', async () => {
    const invalid = render(
      <MemoryRouter initialEntries={['/events/not-a-number']}>
        <Routes>
          <Route path="/events/:eventId" element={<Events />} />
        </Routes>
      </MemoryRouter>,
    );
    expect((await screen.findAllByText('Invalid event ID.')).length).toBeGreaterThan(0);
    invalid.unmount();

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/events/63') return apiResponse('', false, 404);
      return apiResponse([]);
    });
    render(
      <MemoryRouter initialEntries={['/events/63']}>
        <Routes>
          <Route path="/events/:eventId" element={<Events />} />
        </Routes>
      </MemoryRouter>,
    );
    expect((await screen.findAllByText('Failed to load event details.')).length).toBeGreaterThan(0);
  });

  it('reports a failed employee task load and failed task assignment', async () => {
    const record = { ...eventRecord, eventId: 71, eventName: 'Task Error Event', status: 0 };
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/events') return apiResponse([record]);
      if (url === '/api/events/71/staff' && init?.method === 'POST')
        return apiResponse('', false, 500);
      if (url === '/api/events/71/staff') return apiResponse('', false, 503);
      if (url.endsWith('/api/employees'))
        return apiResponse([{ employeeId: 8, name: 'Jordan', jobTitle: 'Coordinator' }]);
      return apiResponse([]);
    });
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>,
    );
    await screen.findByText('Task Error Event');
    fireEvent.click(screen.getByRole('button', { name: 'Assign Task' }));
    expect(
      (await screen.findAllByText('Failed to load assigned employees.')).length,
    ).toBeGreaterThan(0);
    const panel = () =>
      screen.getByRole('heading', { name: 'Assign Employee Task' }).closest('section')!;
    fireEvent.change(screen.getByLabelText(/Employee/), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText(/Task/), { target: { value: 'Check venue' } });
    fireEvent.click(within(panel()).getByRole('button', { name: 'Assign Task' }));
    expect((await screen.findAllByText('Failed to assign employee task.')).length).toBeGreaterThan(
      0,
    );
  });

  it('shows registered and unavailable attendee event states and reports registration errors', async () => {
    setAccount(['Attendee']);
    const records = [
      { ...eventRecord, eventId: 57, eventName: 'Registration Failure', status: 0 },
      { ...eventRecord, eventId: 58, eventName: 'Already Registered', status: 0 },
      { ...eventRecord, eventId: 59, eventName: 'Past Attendee Event', status: 2 },
      { ...eventRecord, eventId: 60, eventName: 'Cancelled Attendee Event', status: 1 },
    ];
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/events' || url === '/api/events') return apiResponse(records);
      if (url === '/api/events/my-registrations') return apiResponse([records[1]]);
      if (url === '/api/events/57/register' && init?.method === 'POST')
        return apiResponse('registration denied', false, 409);
      return apiResponse([]);
    });
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>,
    );
    await screen.findByText('Registration Failure');
    expect(screen.getByText('Registered')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect((await screen.findAllByText('registration denied')).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'all' } });
    expect(await screen.findByText('Past Attendee Event')).toBeInTheDocument();
    expect(screen.getAllByText('Not available')).toHaveLength(2);
  });

  it('loads an event through its route and saves the edited values', async () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const detail = { ...eventRecord, eventId: 62, eventName: 'Route Edit Event', status: 0 };
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/events/62' && init?.method === 'PUT') return apiResponse({});
      if (url === '/api/events/62') return apiResponse(detail);
      if (url === '/api/events') return apiResponse([detail]);
      return apiResponse([]);
    });
    render(
      <MemoryRouter initialEntries={['/events/62']}>
        <Routes>
          <Route path="/events/:eventId" element={<Events />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Edit Event' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Event Name/), {
      target: { value: 'Updated Route Event' },
    });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/events/62',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
    const update = fetchMock.mock.calls.find(
      ([url, init]) => url === '/api/events/62' && init?.method === 'PUT',
    );
    expect(JSON.parse(String(update?.[1]?.body))).toMatchObject({
      eventName: 'Updated Route Event',
    });
  });
});

const eventRecord = {
  eventName: 'Seed Event',
  startDate: futureEventDate(1),
  endDate: futureEventDate(2),
  budget: 100,
  eventType: 0,
  status: 0,
  venueId: 1,
  orgId: 2,
};
