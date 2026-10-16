interface EventItem {
  eventId: number;
  eventName: string;
}

interface EventFilterProps {
  value: string;
  events: EventItem[];
  onChange: (value: string) => void;
}

function EventFilter({ value, events, onChange }: EventFilterProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg border border-border-default bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
    >
      <option value="all">All Events</option>

      {events.map((event) => (
        <option key={event.eventId} value={event.eventId}>
          {event.eventName}
        </option>
      ))}
    </select>
  );
}

export default EventFilter;
