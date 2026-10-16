interface UpcomingEvent {
  eventId: number;
  eventName: string;
  startDate: string;
}

interface UpcomingEventsPanelProps {
  events: UpcomingEvent[];
  loading: boolean;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
}

function UpcomingEventsPanel({
  events,
  loading,
  formatDate,
  formatTime,
}: UpcomingEventsPanelProps) {
  return (
    <section className="w-full rounded-panel border border-border-accent/45 bg-surface-blue-sheer/25 p-6 text-text-blue-deep shadow-panel backdrop-blur-md">
      <header className="mb-5">
        <h2 className="m-0 text-[21px] font-[750] text-text-blue-deep">Upcoming Events</h2>
        <p className="mt-[5px] text-[13px] text-text-blue-muted">Your next scheduled events</p>
      </header>

      {loading && (
        <p className="py-6 text-center text-sm text-text-blue-muted">Loading events...</p>
      )}
      {!loading && events.length === 0 && (
        <p className="py-6 text-center text-sm text-text-blue-muted">No upcoming events.</p>
      )}
      {!loading &&
        events.map((event) => {
          const eventDate = new Date(event.startDate);

          return (
            <div
              key={event.eventId}
              className="flex items-center gap-[14px] border-b border-text-blue-deep/15 py-[14px] last:border-b-0"
            >
              <div className="flex h-[60px] w-[55px] shrink-0 flex-col items-center justify-center rounded-date-badge border border-blue-border bg-surface-blue">
                <strong className="text-[21px] font-extrabold leading-none text-brand-primary">
                  {eventDate.getDate()}
                </strong>
                <span className="mt-1 text-[10px] font-extrabold tracking-[0.7px] text-accent-orange">
                  {eventDate.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="m-0 font-semibold text-text-blue-deep">{event.eventName}</h3>
                <p className="m-0 mt-1 text-[12px] text-text-blue-muted">
                  {formatDate(event.startDate)}
                </p>
                <p className="m-0 text-[12px] text-text-blue-muted">
                  {formatTime(event.startDate)}
                </p>
              </div>
            </div>
          );
        })}
    </section>
  );
}

export default UpcomingEventsPanel;
