// Show attendee details for events.
import { useEffect } from 'react';

interface AttendeeEvent {
  eventName: string;
  startDate: string;
  endDate: string;
  isRegistrationCancelled?: boolean;
}

interface AttendeeEventPopupProps {
  event: AttendeeEvent;
  isCompleted?: boolean;
  top?: number;
  left?: number;
  location: string;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  onClose: () => void;
  onReregister: () => void;
  reregistering: boolean;
}

function AttendeeEventPopup({
  event,
  isCompleted = false,
  location,
  formatDate,
  formatTime,
  onClose,
  onReregister,
  reregistering,
}: AttendeeEventPopupProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1100] grid place-items-center bg-slate-950/15 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="glass-popup glass-popup-orange w-full max-w-lg overflow-hidden text-text-primary"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendee-event-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-blue-200/70 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">
              Event details
            </p>
            <h2 id="attendee-event-title" className="mt-1 break-words text-xl font-bold text-text-primary">
              {event.eventName}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close event details"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border-default bg-white/70 text-xl leading-none text-text-secondary transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            &times;
          </button>
        </header>

        <div className="space-y-4 p-6">
          <section className="rounded-xl border border-blue-100 bg-white/65 p-4" aria-label="Event schedule">
            <div className="mb-3 flex items-center gap-2 text-brand-primary">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="15" rx="3" />
                <path d="M8 3v4M16 3v4M4 9h16" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider">Date and time</span>
            </div>
            <p className="mb-3 text-sm font-semibold text-text-primary">{formatDate(event.startDate)}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-blue-muted/80 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Starts</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{formatTime(event.startDate)}</p>
              </div>
              <div className="rounded-lg bg-surface-blue-muted/80 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Ends</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{formatTime(event.endDate)}</p>
              </div>
            </div>
          </section>

          <section className="flex items-start gap-3 rounded-xl border border-blue-100 bg-white/65 p-4" aria-label="Event location">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-100 text-accent-orange">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
                <circle cx="12" cy="10" r="2" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Location</p>
              <p className="mt-1 break-words text-sm font-semibold text-text-primary">{location}</p>
            </div>
          </section>

          {(isCompleted || event.isRegistrationCancelled) && (
            <div className="flex flex-wrap items-center gap-2">
              {isCompleted && (
                <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                  Completed
                </span>
              )}
              {event.isRegistrationCancelled && (
                <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-900">
                  Registration cancelled
                </span>
              )}
            </div>
          )}

          {event.isRegistrationCancelled && (
            <div className="flex justify-end border-t border-blue-100 pt-4">
              <button
                type="button"
                onClick={onReregister}
                disabled={reregistering}
                className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reregistering ? 'Re-registering...' : 'Re-register'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default AttendeeEventPopup;
