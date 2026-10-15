interface UpcomingEvent {
  eventId: number
  eventName: string
  startDate: string
}

interface UpcomingEventsPanelProps {
  events: UpcomingEvent[]
  loading: boolean
  formatDate: (date: string) => string
  formatTime: (date: string) => string
}

function UpcomingEventsPanel({
  events,
  loading,
  formatDate,
  formatTime,
}: UpcomingEventsPanelProps) {
  return (
    <section className="w-full rounded-[14px] border border-[#1e5b79]/45 bg-[#9bd7e8]/25 p-6 text-[#15394b] shadow-xl shadow-slate-900/25 backdrop-blur-md">
      <header className="mb-5">
        <h2 className="m-0 text-[21px] font-[750] text-[#15394b]">Upcoming Events</h2>
        <p className="mt-[5px] text-[13px] text-[#315b6c]">
          Your next scheduled events
        </p>
      </header>

      {loading && (
        <p className="py-6 text-center text-sm text-[#315b6c]">
          Loading events...
        </p>
      )}
      {!loading && events.length === 0 && (
        <p className="py-6 text-center text-sm text-[#315b6c]">
          No upcoming events.
        </p>
      )}
      {!loading && events.map((event) => {
        const eventDate = new Date(event.startDate)

        return (
          <div
            key={event.eventId}
            className="flex items-center gap-[14px] border-b border-[#15394b]/15 py-[14px] last:border-b-0"
          >
            <div className="flex h-[60px] w-[55px] shrink-0 flex-col items-center justify-center rounded-[9px] border border-[#cfe0ff] bg-[#eaf2ff]">
              <strong className="text-[21px] font-extrabold leading-none text-[#0066ff]">
                {eventDate.getDate()}
              </strong>
              <span className="mt-1 text-[10px] font-extrabold tracking-[0.7px] text-[#ff7a00]">
                {eventDate.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="m-0 font-semibold text-[#15394b]">{event.eventName}</h3>
              <p className="m-0 mt-1 text-[12px] text-[#315b6c]">
                {formatDate(event.startDate)}
              </p>
              <p className="m-0 text-[12px] text-[#315b6c]">
                {formatTime(event.startDate)}
              </p>
            </div>
          </div>
        )
      })}
    </section>
  )
}

export default UpcomingEventsPanel
