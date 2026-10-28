import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardCalendarPanel, {
  type DashboardCalendarPanelProps,
} from '../src/features/dashboard/components/DashboardCalendarPanel';

type SchedulerHarnessProps = Record<string, unknown> & { children?: ReactNode };

function callHandler<T>(handler: unknown, args: T) {
  if (typeof handler === 'function') (handler as (value: T) => void)(args);
}

vi.mock('@syncfusion/ej2-react-schedule', () => ({
  ScheduleComponent: (props: SchedulerHarnessProps) => (
    <div data-testid="schedule" data-readonly={String(props.readonly)}>
      {props.children}
      <button
        onClick={() => callHandler(props.navigating, { currentDate: new Date('2026-11-01') })}
      >
        Navigate calendar
      </button>
      <button onClick={() => callHandler(props.navigating, {})}>Navigate without date</button>
      <button onClick={() => callHandler(props.cellClick, { startTime: new Date() })}>
        Cell click
      </button>
      <button onClick={() => callHandler(props.cellDoubleClick, { cancel: false })}>
        Cell double click
      </button>
      <button onClick={() => callHandler(props.eventDoubleClick, { cancel: false })}>
        Event double click
      </button>
      <button onClick={() => callHandler(props.popupOpen, { type: 'QuickInfo', cancel: false })}>
        Popup open
      </button>
      <button
        onClick={() =>
          callHandler(props.eventRendered, { data: {}, element: document.createElement('div') })
        }
      >
        Event rendered
      </button>
      <button
        onClick={() =>
          callHandler(props.renderCell, {
            element: document.createElement('div'),
            type: 'workCells',
          })
        }
      >
        Render cell
      </button>
    </div>
  ),
  ViewsDirective: ({ children }: { children: ReactNode }) => <>{children}</>,
  ViewDirective: () => null,
  Inject: () => null,
  Month: {},
  Week: {},
  WorkWeek: {},
  Day: {},
  Agenda: {},
}));

const callbacks = {
  onSetCurrentDate: vi.fn(),
  onClearSelectedDate: vi.fn(),
  onCreateEvent: vi.fn(),
  onEventRendered: vi.fn(),
  onCellClick: vi.fn(),
  onCellDoubleClick: vi.fn(),
  onEventDoubleClick: vi.fn(),
  onPopupOpen: vi.fn(),
  onRenderCell: vi.fn(),
  onCloseAttendeePopup: vi.fn(),
  onReregister: vi.fn(),
  reregisteringEventId: null,
  formatDisplayDate: vi.fn(() => 'Oct 20, 2026'),
  formatTime: vi.fn(() => '5:30 PM'),
  onCloseEventForm: vi.fn(),
  onSaveEvent: vi.fn(),
};

function props(overrides: Partial<DashboardCalendarPanelProps> = {}): DashboardCalendarPanelProps {
  return {
    monthEventCount: 1,
    selectedDate: null,
    currentDate: new Date('2026-10-01'),
    schedulerEvents: [],
    loading: false,
    canManageEvents: true,
    isAttendee: false,
    venues: [{ venueId: 2, address: 'Main Hall', capacity: 100 }],
    organizations: [{ orgId: 5, name: 'WinWire' }],
    attendeeEventPopup: null,
    showEventForm: false,
    editingEventId: null,
    savingEvent: false,
    formData: {
      eventName: '',
      eventType: '0',
      startDate: '',
      endDate: '',
      venueId: '',
      orgId: '',
      budget: '',
    },
    ...callbacks,
    ...overrides,
  };
}

beforeEach(() => vi.clearAllMocks());

describe('Dashboard calendar panel', () => {
  it('shows loading, singular and plural event counts, and the selected date', () => {
    const { rerender } = render(
      <DashboardCalendarPanel {...props({ loading: true, monthEventCount: 1 })} />,
    );
    expect(screen.getByText('Loading events...')).toBeInTheDocument();
    expect(screen.getByText('1 event this month')).toBeInTheDocument();
    rerender(
      <DashboardCalendarPanel
        {...props({ monthEventCount: 3, selectedDate: new Date('2026-10-08') })}
      />,
    );
    expect(screen.getByText('3 events this month')).toBeInTheDocument();
    expect(screen.getByText('Selected date: Oct 8, 2026')).toBeInTheDocument();
  });

  it('provides calendar callbacks and allows a manager to open the create form', () => {
    render(<DashboardCalendarPanel {...props()} />);
    expect(screen.getByTestId('schedule')).toHaveAttribute('data-readonly', 'false');
    fireEvent.click(screen.getByRole('button', { name: '+ Add Event' }));
    expect(callbacks.onCreateEvent).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Navigate calendar' }));
    expect(callbacks.onSetCurrentDate).toHaveBeenCalledWith(new Date('2026-11-01'));
    expect(callbacks.onClearSelectedDate).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Navigate without date' }));
    expect(callbacks.onClearSelectedDate).toHaveBeenCalledOnce();
    for (const label of [
      'Cell click',
      'Cell double click',
      'Event double click',
      'Popup open',
      'Event rendered',
      'Render cell',
    ]) {
      fireEvent.click(screen.getByRole('button', { name: label }));
    }
    expect(callbacks.onCellClick).toHaveBeenCalledOnce();
    expect(callbacks.onCellDoubleClick).toHaveBeenCalledOnce();
    expect(callbacks.onEventDoubleClick).toHaveBeenCalledOnce();
    expect(callbacks.onPopupOpen).toHaveBeenCalledOnce();
    expect(callbacks.onEventRendered).toHaveBeenCalledOnce();
    expect(callbacks.onRenderCell).toHaveBeenCalledOnce();
    expect(screen.getByText(/Use Add Event to create/)).toBeInTheDocument();
  });

  it('shows the create modal with required budget and loaded venue and organization options', async () => {
    render(<DashboardCalendarPanel {...props({ showEventForm: true })} />);
    expect(screen.getByRole('dialog', { name: 'Create event' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create Event' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Event Name/), { target: { value: 'Launch' } });
    fireEvent.change(screen.getByLabelText(/Event Type/), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-10-20' } });
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-10-20' } });
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText(/Venue/), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Budget/), { target: { value: '250' } });
    expect(screen.getByRole('option', { name: 'Main Hall - Capacity: 100' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'WinWire' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create Event' }));
    await waitFor(() => expect(callbacks.onSaveEvent).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole('button', { name: 'Close create event dialog' }));
    expect(callbacks.onCloseEventForm).toHaveBeenCalledOnce();
  });

  it('shows the edit modal and saving states', () => {
    render(
      <DashboardCalendarPanel
        {...props({ showEventForm: true, editingEventId: 12, savingEvent: true })}
      />,
    );
    expect(screen.getByRole('dialog', { name: 'Edit event' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Edit Event' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });

  it('renders read-only attendee calendar details and location fallback', () => {
    const event = {
      eventId: 4,
      eventName: 'Town Hall',
      startDate: '2026-10-20T17:30:00',
      endDate: '2026-10-20T18:30:00',
      eventType: 0,
      status: 'Scheduled',
      venueId: 99,
    };
    const { rerender } = render(
      <DashboardCalendarPanel
        {...props({
          canManageEvents: false,
          isAttendee: true,
          attendeeEventPopup: { event, top: 20, left: 30 },
        })}
      />,
    );
    expect(screen.getByTestId('schedule')).toHaveAttribute('data-readonly', 'true');
    expect(screen.queryByRole('button', { name: '+ Add Event' })).not.toBeInTheDocument();
    expect(screen.getByText('Location unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Oct 20, 2026/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close event details' }));
    expect(callbacks.onCloseAttendeePopup).toHaveBeenCalledOnce();
    rerender(
      <DashboardCalendarPanel
        {...props({
          canManageEvents: false,
          isAttendee: false,
          attendeeEventPopup: { event, top: 20, left: 30 },
        })}
      />,
    );
    expect(screen.queryByRole('dialog', { name: 'Town Hall' })).not.toBeInTheDocument();
    expect(screen.getByText('Select a calendar event to view it.')).toBeInTheDocument();
  });

  it('shows cancellation status and re-register action in the attendee event popup', () => {
    const event = {
      eventId: 14,
      eventName: 'Town Hall',
      startDate: '2026-10-20T17:30:00',
      endDate: '2026-10-20T18:30:00',
      eventType: 0,
      status: 'Scheduled',
      isRegistrationCancelled: true,
    };
    const { rerender } = render(
      <DashboardCalendarPanel
        {...props({
          canManageEvents: false,
          isAttendee: true,
          attendeeEventPopup: { event, top: 20, left: 30 },
        })}
      />,
    );

    expect(screen.getByText('Registration cancelled')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Re-register' }));
    expect(callbacks.onReregister).toHaveBeenCalledWith(14);

    rerender(
      <DashboardCalendarPanel
        {...props({
          canManageEvents: false,
          isAttendee: true,
          reregisteringEventId: 14,
          attendeeEventPopup: { event, top: 20, left: 30 },
        })}
      />,
    );
    expect(screen.getByRole('button', { name: 'Re-registering...' })).toBeDisabled();
  });
});
