interface EventItem {
  eventId: number
  eventName: string
}

interface EventFilterProps {
  value: string
  events: EventItem[]
  onChange: (value: string) => void
}

function EventFilter({
  value,
  events,
  onChange,
}: EventFilterProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20"
    >
      <option value="all">
        All Events
      </option>

      {events.map((event) => (
        <option
          key={event.eventId}
          value={event.eventId}
        >
          {event.eventName}
        </option>
      ))}
    </select>
  )
}

export default EventFilter