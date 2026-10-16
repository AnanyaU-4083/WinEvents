import { useEffect, useState } from 'react';
import StatusBadge from '@/shared/components/StatusBadge';

type EventStatus = 0 | 1 | 2;
type EventType = 0 | 1 | 2 | 3 | 4 | 5;

interface EventListItem {
  eventId: number;
  eventName: string;
  startDate: string;
  endDate: string;
  budget: number | null;
  eventType: EventType;
  status: EventStatus;
  venueId: number | null;
  orgId: number | null;
}

interface EventListPanelProps {
  events: EventListItem[];
  loading: boolean;
  searchValue: string;
  statusFilter: string;
  canManageEvents: boolean;
  isAttendee: boolean;
  registeringEventId: number | null;
  cancellingRegistrationEventId: number | null;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  isRegistered: (eventId: number) => boolean;
  isRegistrationCancelled: (eventId: number) => boolean;
  getEventTypeText: (eventType: EventType) => string;
  formatDate: (date: string) => string;
  onAssign: (event: EventListItem) => void;
  onEdit: (eventId: number) => void;
  onCancel: (eventId: number) => void;
  onRegister: (eventId: number) => void;
  onCancelRegistration: (eventId: number) => void;
}

function EventListPanel({
  events,
  loading,
  searchValue,
  statusFilter,
  canManageEvents,
  isAttendee,
  registeringEventId,
  cancellingRegistrationEventId,
  onSearchChange,
  onStatusFilterChange,
  isRegistered,
  isRegistrationCancelled,
  getEventTypeText,
  formatDate,
  onAssign,
  onEdit,
  onCancel,
  onRegister,
  onCancelRegistration,
}: EventListPanelProps) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const emptyMessage =
    statusFilter === 'upcoming'
      ? 'There are no upcoming events.'
      : statusFilter === 'ongoing'
        ? 'There are no ongoing events.'
        : statusFilter === 'completed'
          ? 'There are no past or completed events.'
          : statusFilter === 'cancelled'
            ? 'There are no cancelled events.'
            : canManageEvents
              ? 'Create your first event to see it here.'
              : 'There are no events matching your search.';

  return (
    <section className="mb-6 w-full overflow-hidden rounded-xl border border-border-accent/35 bg-white shadow-card">
      <header className="border-b border-border-subtle px-6 py-5">
        <h2 className="text-lg font-semibold text-text-primary">Events</h2>
        <p className="mt-1 text-sm text-text-muted">
          {canManageEvents
            ? 'View and manage your events.'
            : 'View available events and register for the ones you want to attend.'}
        </p>
      </header>

      <div className="flex flex-col gap-3 border-b border-border-subtle p-6 md:flex-row">
        <input
          className="w-full rounded-lg border border-border-default bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-placeholder focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          type="text"
          placeholder="Search events..."
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <select
          className="w-full rounded-lg border border-border-default bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
        >
          <option value="upcoming">Upcoming Events</option>
          <option value="ongoing">Ongoing Events</option>
          <option value="all">All Statuses</option>
          <option value="completed">Past / Completed Events</option>
          <option value="cancelled">Cancelled Events</option>
        </select>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr>
              {['Event Name', 'Type', 'Start Date', 'End Date', 'Status', 'Actions'].map(
                (heading) => (
                  <th
                    key={heading}
                    className="bg-surface-subtle px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                    <h3>Loading events...</h3>
                  </div>
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                    <h3>No events found</h3>
                    <p className="mt-2 text-sm text-text-muted">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              events.map((event) => {
                const registered = isRegistered(event.eventId);
                const registrationCancelled = isRegistrationCancelled(event.eventId);
                const start = new Date(event.startDate).getTime();
                const end = new Date(event.endDate).getTime();
                const displayStatus =
                  event.status === 1
                    ? 'Cancelled'
                    : event.status === 2
                      ? 'Completed'
                      : end < now
                        ? 'Past'
                        : start <= now
                          ? 'Ongoing'
                          : 'Upcoming';
                const eventIsPast = displayStatus === 'Past' || displayStatus === 'Completed';
                return (
                  <tr key={event.eventId}>
                    <td className="border-t border-border-subtle px-5 py-4 text-sm text-text-secondary">
                      {event.eventName}
                    </td>
                    <td className="border-t border-border-subtle px-5 py-4 text-sm text-text-secondary">
                      {getEventTypeText(event.eventType)}
                    </td>
                    <td className="border-t border-border-subtle px-5 py-4 text-sm text-text-secondary">
                      {formatDate(event.startDate)}
                    </td>
                    <td className="border-t border-border-subtle px-5 py-4 text-sm text-text-secondary">
                      {formatDate(event.endDate)}
                    </td>
                    <td className="border-t border-border-subtle px-5 py-4 text-sm text-text-secondary">
                      <StatusBadge status={displayStatus} />
                    </td>
                    <td className="border-t border-border-subtle px-5 py-4 text-sm text-text-secondary">
                      {canManageEvents && (
                        <>
                          {event.status !== 1 && event.status !== 2 && !eventIsPast && (
                            <>
                              <button
                                type="button"
                                className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-hover"
                                onClick={() => onAssign(event)}
                              >
                                Assign Task
                              </button>
                              <button
                                type="button"
                                className="ml-2 rounded-lg border border-border-default bg-white px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-subtle"
                                onClick={() => onEdit(event.eventId)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="ml-2 rounded-lg border border-border-default bg-white px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-subtle"
                                onClick={() => onCancel(event.eventId)}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {event.status === 1 && (
                            <span className="text-sm text-text-muted">Cancelled</span>
                          )}
                          {event.status === 2 && (
                            <span className="text-sm text-text-muted">Completed</span>
                          )}
                        </>
                      )}

                      {isAttendee && (
                        <>
                          {registered ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                                Registered
                              </span>
                              {event.status === 0 && !eventIsPast && (
                                <button
                                  type="button"
                                  className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-800 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={cancellingRegistrationEventId === event.eventId}
                                  onClick={() => onCancelRegistration(event.eventId)}
                                >
                                  {cancellingRegistrationEventId === event.eventId
                                    ? 'Cancelling...'
                                    : 'Cancel Registration'}
                                </button>
                              )}
                            </div>
                          ) : registrationCancelled ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-800">
                                Cancelled
                              </span>
                              {event.status === 0 && !eventIsPast && (
                                <button
                                  type="button"
                                  className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={registeringEventId === event.eventId}
                                  onClick={() => onRegister(event.eventId)}
                                >
                                  {registeringEventId === event.eventId
                                    ? 'Registering...'
                                    : 'Re-register'}
                                </button>
                              )}
                            </div>
                          ) : event.status === 0 && displayStatus === 'Upcoming' ? (
                            <button
                              type="button"
                              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={registeringEventId === event.eventId}
                              onClick={() => onRegister(event.eventId)}
                            >
                              {registeringEventId === event.eventId ? 'Registering...' : 'Register'}
                            </button>
                          ) : (
                            <span className="text-sm text-text-muted">Not available</span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default EventListPanel;
