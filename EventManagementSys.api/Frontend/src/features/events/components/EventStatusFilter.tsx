// Filter events by lifecycle status.
interface EventStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

function EventStatusFilter({ value, onChange }: EventStatusFilterProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg border border-border-default bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
    >
      <option value="scheduled">Scheduled</option>

      <option value="past">Past Events</option>

      <option value="cancelled">Cancelled</option>

      <option value="all">All Events</option>
    </select>
  );
}

export default EventStatusFilter;
