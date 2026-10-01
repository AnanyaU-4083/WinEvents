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