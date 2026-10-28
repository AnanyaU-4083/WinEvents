// Display the next scheduled events.
interface UpcomingEvent {
  eventId: number;
  eventName: string;
  startDate: string;
  endDate?: string;
  location?: string;
}

interface UpcomingEventsPanelProps {
  events: UpcomingEvent[];
  loading: boolean;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  onSelectEvent?: (eventId: number) => void;
}

function UpcomingEventsPanel({ events, loading, formatDate, formatTime, onSelectEvent }: UpcomingEventsPanelProps) {
  return (
    <section className="dashboard-upcoming-panel" aria-labelledby="dashboard-upcoming-title">
      <header className="dashboard-panel-heading">
        <span className="dashboard-heading-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="5" width="17" height="15" rx="3" />
            <path d="M8 3v4M16 3v4M4 9h16" />
          </svg>
        </span>
        <div>
          <h2 id="dashboard-upcoming-title">Upcoming Events</h2>
          <p>Your next scheduled events</p>
        </div>
      </header>

      {loading && <p className="dashboard-panel-message" role="status">Loading events...</p>}
      {!loading && events.length === 0 && (
        <p className="dashboard-panel-message">No upcoming events.</p>
      )}
      {!loading && events.length > 0 && (
        <ul className="dashboard-upcoming-list">
          {events.map((event, index) => {
            const eventDate = new Date(event.startDate);
            const day = eventDate.toLocaleString('en-US', { weekday: 'short' });
            const month = eventDate.toLocaleString('en-US', { month: 'short' });
            return (
              <li key={event.eventId}>
                <button
                  type="button"
                  className={`dashboard-upcoming-card dashboard-upcoming-card-${index % 3}`}
                  aria-label={`View details for ${event.eventName}`}
                  disabled={!onSelectEvent}
                  onClick={() => onSelectEvent?.(event.eventId)}
                >
                <div className="dashboard-date-tile" aria-label={formatDate(event.startDate)}>
                  <span>{month}</span>
                  <strong>{eventDate.getDate().toString().padStart(2, '0')}</strong>
                  <span>{day}</span>
                </div>
                <div className="dashboard-upcoming-copy">
                  <h3>{event.eventName}</h3>
                  <p>
                    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                    <span>{formatTime(event.startDate)} – {formatTime(event.endDate || event.startDate)}</span>
                  </p>
                  <p>
                    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></svg>
                    <span>{event.location || 'Location unavailable'}</span>
                  </p>
                </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default UpcomingEventsPanel;


