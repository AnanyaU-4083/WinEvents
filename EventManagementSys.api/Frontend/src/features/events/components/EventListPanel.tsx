// Display filterable event records clearly.
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
  getVenueName?: (venueId: number | null) => string | null;
  onAssign: (event: EventListItem) => void;
  onEdit: (eventId: number) => void;
  onCancel: (eventId: number) => void;
  onRegister: (eventId: number) => void;
  onCancelRegistration: (eventId: number) => void;
}

function getDisplayStatus(event: EventListItem, now: number) {
  const start = new Date(event.startDate).getTime();
  const end = new Date(event.endDate).getTime();
  if (event.status === 1) return 'Cancelled';
  if (event.status === 2) return 'Completed';
  if (end < now) return 'Past';
  if (start <= now) return 'Ongoing';
  return 'Upcoming';
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Time unavailable'
    : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
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
  getVenueName,
  onAssign,
  onEdit,
  onCancel,
  onRegister,
  onCancelRegistration,
}: EventListPanelProps) {
  const [now, setNow] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchValue]);

  const pageCount = Math.ceil(events.length / 9);
  const displayedEvents = events.slice((currentPage - 1) * 9, currentPage * 9);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(pageCount, 1)));
  }, [pageCount]);

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

  const paginationControls = pageCount > 1 && (
    <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Event pages">
      <button
        type="button"
        className="rounded-lg border border-border-default bg-white px-4 py-2 text-sm font-medium text-text-secondary transition hover:border-brand-primary hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      <span className="text-sm text-text-secondary" aria-live="polite">
        Page {currentPage} of {pageCount}
      </span>
      <button
        type="button"
        className="rounded-lg border border-border-default bg-white px-4 py-2 text-sm font-medium text-text-secondary transition hover:border-brand-primary hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
        disabled={currentPage === pageCount}
      >
        Next
      </button>
    </nav>
  );
  return (
    <section className="glass-panel mb-6 w-full overflow-hidden">
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

      {isAttendee && (
        <div className="px-6 pb-6">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" role="status">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm"
                >
                  <div className="h-36 animate-pulse bg-gradient-to-br from-blue-100 via-blue-50 to-orange-100" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                    <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
                  </div>
                </div>
              ))}
              <span className="sr-only">Loading events...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 px-6 py-12 text-center">
              <span
                className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-xl text-brand-primary"
                aria-hidden="true"
              >
                *
              </span>
              <h3 className="mt-4 text-lg font-semibold text-text-primary">No events to show</h3>
              <p className="mt-2 text-sm text-text-muted">{emptyMessage}</p>
              <p className="mt-1 text-sm text-text-muted">Try another filter or check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {displayedEvents.map((event) => {
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
                const registered = isRegistered(event.eventId);
                const registrationCancelled = isRegistrationCancelled(event.eventId);
                const startDate = new Date(event.startDate);

                return (
                  <article
                    key={event.eventId}
                    aria-labelledby={'event-card-title-' + event.eventId}
                    className="group overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-brand-primary/40 hover:shadow-xl focus-within:ring-2 focus-within:ring-brand-primary/30"
                  >
                    <div className="relative flex h-28 items-end overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-sky-500 p-4">
                      <div
                        aria-hidden="true"
                        className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl transition-transform duration-300 group-hover:scale-125"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute bottom-[-3rem] right-20 h-28 w-28 rounded-full bg-accent-orange/50 blur-2xl"
                      />
                      <div className="relative flex w-full items-end justify-between gap-3">
                        <div>
                          <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                            {getEventTypeText(event.eventType)}
                          </span>
                          <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-blue-100">
                            Featured event
                          </p>
                        </div>
                        <div className="grid min-w-14 place-items-center rounded-xl border border-white/50 bg-white/95 px-3 py-2 text-center shadow-lg">
                          <span className="text-xl font-bold leading-none text-brand-primary">
                            {Number.isNaN(startDate.getTime())
                              ? 'ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â'
                              : startDate.getDate()}
                          </span>
                          <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-accent-orange">
                            {Number.isNaN(startDate.getTime())
                              ? 'Date'
                              : startDate.toLocaleDateString(undefined, { month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                            {getEventTypeText(event.eventType)}
                          </p>
                          <h3
                            id={'event-card-title-' + event.eventId}
                            className="mt-1 truncate text-xl font-bold text-text-primary"
                            title={event.eventName}
                          >
                            {event.eventName}
                          </h3>
                        </div>
                        <StatusBadge status={displayStatus} />
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-surface-blue-muted/70 p-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                            Starts
                          </p>
                          <p className="mt-1 text-xs font-medium leading-5 text-text-secondary">
                            {formatDate(event.startDate)}
                          </p>
                        </div>
                        <div className="min-w-0 border-l border-blue-100 pl-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                            Ends
                          </p>
                          <p className="mt-1 text-xs font-medium leading-5 text-text-secondary">
                            {formatDate(event.endDate)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-border-subtle pt-4">
                        {registered ? (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-state-success">
                              <span
                                className="grid h-6 w-6 place-items-center rounded-full bg-green-100"
                                aria-hidden="true"
                              >
                                *
                              </span>
                              You are registered
                            </span>
                            {event.status === 0 && !eventIsPast && (
                              <button
                                type="button"
                                className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={cancellingRegistrationEventId === event.eventId}
                                onClick={() => onCancelRegistration(event.eventId)}
                              >
                                {cancellingRegistrationEventId === event.eventId
                                  ? 'Cancelling...'
                                  : 'Cancel registration'}
                              </button>
                            )}
                          </div>
                        ) : registrationCancelled ? (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-orange-800">
                              Registration cancelled
                            </span>
                            {event.status === 0 && !eventIsPast && (
                              <button
                                type="button"
                                className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={registeringEventId === event.eventId}
                                onClick={() => onRegister(event.eventId)}
                              >
                                {registeringEventId === event.eventId
                                  ? 'Registering...'
                                  : 'Register again'}
                              </button>
                            )}
                          </div>
                        ) : event.status === 0 && displayStatus === 'Upcoming' ? (
                          <button
                            type="button"
                            className="w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-primary-hover hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={registeringEventId === event.eventId}
                            onClick={() => onRegister(event.eventId)}
                          >
                            {registeringEventId === event.eventId
                              ? 'Registering...'
                              : 'Register for event'}
                          </button>
                        ) : (
                          <div className="flex items-center justify-between text-sm text-text-muted">
                            <span>
                              {displayStatus === 'Cancelled'
                                ? 'This event was cancelled'
                                : 'Registration is closed'}
                            </span>
                            <span className="rounded-full bg-surface-subtle px-3 py-1 text-xs font-semibold">
                              {displayStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {paginationControls}
        </div>
      )}
      {!isAttendee && (
        <div className="space-y-2.5 px-5 pb-5">
          {loading ? (
            <div className="space-y-2" role="status">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl border border-border-subtle bg-white/60"
                />
              ))}
              <span className="sr-only">Loading events...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-blue-200 bg-white/55 px-5 py-10 text-center">
              <h3 className="text-base font-semibold text-text-primary">No events to show</h3>
              <p className="mt-1 text-sm text-text-muted">{emptyMessage}</p>
            </div>
          ) : (
            <ul className="space-y-2.5" aria-label="Events">
              {displayedEvents.map((event) => {
                const start = new Date(event.startDate);
                const end = new Date(event.endDate);
                const displayStatus = getDisplayStatus(event, now);
                const eventIsPast = displayStatus === 'Past' || displayStatus === 'Completed';
                const canManage =
                  canManageEvents && event.status !== 1 && event.status !== 2 && !eventIsPast;
                const venueName = event.venueId === null ? null : getVenueName?.(event.venueId);
                const validStart = !Number.isNaN(start.getTime());
                const dateLabel = validStart
                  ? start
                      .toLocaleDateString(undefined, { month: 'short', day: '2-digit' })
                      .toUpperCase()
                  : 'DATE';
                const sameDay =
                  validStart &&
                  !Number.isNaN(end.getTime()) &&
                  start.toDateString() === end.toDateString();
                const schedule = sameDay
                  ? formatTime(event.startDate) + ' - ' + formatTime(event.endDate)
                  : formatDate(event.startDate) +
                    ' | ' +
                    formatTime(event.startDate) +
                    ' - ' +
                    formatDate(event.endDate) +
                    ' | ' +
                    formatTime(event.endDate);

                return (
                  <li key={event.eventId}>
                    <article className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-white/75 p-3 shadow-sm transition hover:border-brand-primary/35 hover:bg-white/90 hover:shadow-md sm:flex-nowrap sm:gap-4 sm:p-4">
                      <div className="grid h-14 w-14 shrink-0 place-content-center rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-orange-50 text-center text-xs font-bold uppercase text-brand-primary sm:h-16 sm:w-16">
                        {dateLabel}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <h3 className="truncate text-base font-semibold text-text-primary sm:text-lg">
                            {event.eventName}
                          </h3>
                          <StatusBadge status={displayStatus} />
                        </div>
                        <p className="mt-1 truncate text-sm text-text-secondary">
                          <span className="font-medium text-text-primary">
                            {getEventTypeText(event.eventType)}
                          </span>
                          <span aria-hidden="true"> | </span>
                          {schedule}
                        </p>
                        {venueName && (
                          <p className="mt-1 truncate text-xs text-text-muted sm:text-sm">
                            {venueName}
                          </p>
                        )}
                      </div>
                      {canManage && (
                        <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto">
                          <button
                            type="button"
                            className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                            onClick={() => onAssign(event)}
                          >
                            Assign Task
                          </button>
                          <button
                            type="button"
                            aria-label={'Edit ' + event.eventName}
                            title="Edit event"
                            className="grid h-10 w-10 place-items-center rounded-lg border border-border-subtle bg-white text-text-secondary transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                            onClick={() => onEdit(event.eventId)}
                          >
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
                                d="m16.5 3.5 4 4M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            aria-label={'Cancel ' + event.eventName}
                            title="Cancel event"
                            className="grid h-10 w-10 place-items-center rounded-lg border border-red-200 bg-white text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            onClick={() => onCancel(event.eventId)}
                          >
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
                                d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                      {!canManage && event.status === 1 && <StatusBadge status="Cancelled" />}
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
          {paginationControls}
        </div>
      )}
    </section>
  );
}

export default EventListPanel;
