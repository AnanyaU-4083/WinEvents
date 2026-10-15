interface AttendeeEvent {
  eventName: string
  startDate: string
  endDate: string
  isRegistrationCancelled?: boolean
}

interface AttendeeEventPopupProps {
  event: AttendeeEvent
  top: number
  left: number
  location: string
  formatDate: (date: string) => string
  formatTime: (date: string) => string
  onClose: () => void
  onReregister: () => void
  reregistering: boolean
}

function AttendeeEventPopup({
  event,
  top,
  left,
  location,
  formatDate,
  formatTime,
  onClose,
  onReregister,
  reregistering,
}: AttendeeEventPopupProps) {
  return (
    <div
      className="fixed z-[1100] w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-[#fed7aa] bg-[#fff1e6] p-4 text-[#7c2d12] shadow-xl shadow-slate-900/20"
      style={{ top, left }}
      role="dialog"
      aria-labelledby="attendee-event-title"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 id="attendee-event-title" className="text-base font-semibold">
          {event.eventName}
        </h3>
        <button
          type="button"
          aria-label="Close event details"
          onClick={onClose}
          className="text-xl leading-none text-[#9a3412] hover:text-[#7c2d12]"
        >
          X
        </button>
      </div>
      <p className="mb-2 text-sm">
        {formatDate(event.startDate)} | {formatTime(event.startDate)} -{' '}
        {formatTime(event.endDate)}
      </p>
      <p className="text-sm">Location: {location}</p>
      {event.isRegistrationCancelled && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="rounded-md bg-[#ffddb8] px-2.5 py-1 text-sm font-semibold text-[#9a3412]">
            Cancelled
          </span>
          <button
            type="button"
            onClick={onReregister}
            disabled={reregistering}
            className="rounded-lg bg-[#0066ff] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0052cc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reregistering ? 'Re-registering...' : 'Re-register'}
          </button>
        </div>
      )}
    </div>
  )
}

export default AttendeeEventPopup
