interface AttendeeEvent {
  eventName: string;
  startDate: string;
  endDate: string;
  isRegistrationCancelled?: boolean;
}

interface AttendeeEventPopupProps {
  event: AttendeeEvent;
  top: number;
  left: number;
  location: string;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  onClose: () => void;
  onReregister: () => void;
  reregistering: boolean;
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
      className="fixed z-[1100] w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-orange-border-soft bg-surface-orange-popup p-4 text-text-orange-rich shadow-panel"
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
          className="text-xl leading-none text-text-orange-deep hover:text-text-orange-rich"
        >
          X
        </button>
      </div>
      <p className="mb-2 text-sm">
        {formatDate(event.startDate)} | {formatTime(event.startDate)} - {formatTime(event.endDate)}
      </p>
      <p className="text-sm">Location: {location}</p>
      {event.isRegistrationCancelled && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="rounded-md bg-orange-border-light px-2.5 py-1 text-sm font-semibold text-text-orange-deep">
            Cancelled
          </span>
          <button
            type="button"
            onClick={onReregister}
            disabled={reregistering}
            className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reregistering ? 'Re-registering...' : 'Re-register'}
          </button>
        </div>
      )}
    </div>
  );
}

export default AttendeeEventPopup;
