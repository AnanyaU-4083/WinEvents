interface EventStatusFilterProps {
  value: string
  onChange: (value: string) => void
}

function EventStatusFilter({
  value,
  onChange,
}: EventStatusFilterProps) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20"
    >
      <option value="scheduled">
        Scheduled
      </option>

      <option value="past">
        Past Events
      </option>

      <option value="cancelled">
        Cancelled
      </option>

      <option value="all">
        All Events
      </option>
    </select>
  )
}

export default EventStatusFilter