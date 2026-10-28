// Manage attendees and event registrations.
import { apiRequest } from '../../../shared/api/apiClient';
import { useAccessToken } from '@/shared/hooks/useAccessToken';
import { useEffect, useState } from 'react';

import SearchBar from '@/shared/components/SearchBar';
import EventFilter from '@/shared/components/EventFilter';
import PageHeader from '@/shared/components/PageHeader';
import FormField from '@/shared/components/FormField';
import Modal from '@/shared/components/Modal';

interface Attendee {
  attendeeId: number;
  name: string;
  email: string;
  phone: string;
  ticket: string;
}

interface EventItem {
  eventId: number;
  eventName: string;
}

interface Participant {
  attendeeId: number;
  name: string;
  email: string;
  eventId: number;
  eventName: string;
  registeredAt: string;
}

interface AttendeeForm {
  name: string;
  email: string;
  phone: string;
  ticket: string;
  eventId: string;
}

const API_URL = '/api';

function ParticipantsPage() {
  const { account, getAccessToken } = useAccessToken();

  const [selectedEvent, setSelectedEvent] = useState('all');

  const [searchTerm, setSearchTerm] = useState('');

  const [participants, setParticipants] = useState<Participant[]>([]);

  const [attendees, setAttendees] = useState<Attendee[]>([]);

  const [events, setEvents] = useState<EventItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);

  const [attendeeForm, setAttendeeForm] = useState<AttendeeForm>({
    name: '',
    email: '',
    phone: '',
    ticket: '',
    eventId: '',
  });

  //Load events and participants.
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        //Check Microsoft account.
        if (!account) {
          throw new Error('Please log in with Microsoft first.');
        }

        //Get Microsoft access token.
        const token = await getAccessToken();

        if (cancelled) {
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        //STEP 1: Load events
        //GET /api/events

        const eventsResponse = await apiRequest(`${API_URL}/events`, {
          method: 'GET',
          headers,
        });

        if (!eventsResponse.ok) {
          throw new Error(`Failed to load events. Status: ${eventsResponse.status}`);
        }

        const eventData: EventItem[] = await eventsResponse.json();

        if (cancelled) {
          return;
        }

        setEvents(eventData);

        //STEP 2: Load attendees
        //GET /api/attendees

        const attendeesResponse = await apiRequest(`${API_URL}/attendees`, {
          method: 'GET',
          headers,
        });

        if (!attendeesResponse.ok) {
          throw new Error(`Failed to load attendees. Status: ${attendeesResponse.status}`);
        }

        const attendeeData: Attendee[] = await attendeesResponse.json();

        if (cancelled) {
          return;
        }

        setAttendees(attendeeData);

        //STEP 3: Load event attendees

        const allParticipants: Participant[] = [];

        for (const event of eventData) {
          if (cancelled) {
            return;
          }

          const response = await apiRequest(`${API_URL}/events/${event.eventId}/attendees`, {
            method: 'GET',
            headers,
          });

          //Continue after event failures.
          if (!response.ok) {
            console.error(
              `Failed to load attendees for event ${event.eventId}. Status: ${response.status}`,
            );

            continue;
          }

          const eventAttendeeData: Attendee[] = await response.json();

          //Convert attendee response data.
          eventAttendeeData.forEach((attendee) => {
            allParticipants.push({
              attendeeId: attendee.attendeeId,

              name: attendee.name,

              email: attendee.email,

              eventId: event.eventId,

              eventName: event.eventName,

              registeredAt: 'Registered',
            });
          });
        }

        if (cancelled) {
          return;
        }

        //Save participants in React state.
        setParticipants(allParticipants);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error('Error loading participants:', error);

        setError(error instanceof Error ? error.message : 'Unable to load participants.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    //Cancel active request on unmount.
    return () => {
      cancelled = true;
    };

    //Reload when account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.homeAccountId]);

  //Filter participants by search.
  const filteredParticipants = participants.filter((participant) => {
    const matchesSearch =
      participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEvent =
      selectedEvent === 'all' || participant.eventId.toString() === selectedEvent;

    return matchesSearch && matchesEvent;
  });

  //Open participant form.
  const openAddParticipant = () => {
    setAttendeeForm({
      name: '',
      email: '',
      phone: '',
      ticket: '',
      eventId: '',
    });

    setError('');

    setShowAddForm(true);
  };

  //Handle participant form changes.
  const handleAttendeeChange = (
    event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setAttendeeForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  //Register attendee for selected event.
  const addParticipant = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');

      if (!attendeeForm.eventId) {
        throw new Error('Please select an event.');
      }

      //Get Microsoft access token.
      const token = await getAccessToken();

      const headers = {
        'Content-Type': 'application/json',

        Authorization: `Bearer ${token}`,
      };

      //STEP 1: Create attendee
      //POST /api/attendees
      const attendeeResponse = await apiRequest(`${API_URL}/attendees`, {
        method: 'POST',
        headers,

        body: JSON.stringify({
          name: attendeeForm.name,
          email: attendeeForm.email,
          phone: attendeeForm.phone,
          ticket: attendeeForm.ticket,
        }),
      });

      if (!attendeeResponse.ok) {
        const message = await attendeeResponse.text();

        throw new Error(message || `Failed to create attendee. Status: ${attendeeResponse.status}`);
      }

      const newAttendee: Attendee = await attendeeResponse.json();

      //STEP 2: Register attendee
      //POST /api/events/{eventId}/attendees/{attendeeId}
      const registrationResponse = await apiRequest(
        `${API_URL}/events/${attendeeForm.eventId}/attendees/${newAttendee.attendeeId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!registrationResponse.ok) {
        const message = await registrationResponse.text();

        throw new Error(
          message ||
            `Attendee was created, but registration failed. Status: ${registrationResponse.status}`,
        );
      }

      //Find selected event.
      const selectedEventData = events.find(
        (item) => item.eventId.toString() === attendeeForm.eventId,
      );

      //Add participant to state.
      if (selectedEventData) {
        setAttendees((previous) => [...previous, newAttendee]);
        setParticipants((previous) => [
          ...previous,
          {
            attendeeId: newAttendee.attendeeId,

            name: newAttendee.name,

            email: newAttendee.email,

            eventId: selectedEventData.eventId,

            eventName: selectedEventData.eventName,

            registeredAt: 'Registered',
          },
        ]);
      }

      //Close participant form.
      setShowAddForm(false);

      setAttendeeForm({
        name: '',
        email: '',
        phone: '',
        ticket: '',
        eventId: '',
      });
    } catch (error) {
      console.error('Error adding participant:', error);

      setError(error instanceof Error ? error.message : 'Unable to add participant.');
    } finally {
      setLoading(false);
    }
  };

  //Remove event registration.
  const removeParticipant = async (eventId: number, attendeeId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to remove this participant from the event?',
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');

      //Get Microsoft access token.
      const token = await getAccessToken();

      //DELETE event registration
      //DELETE /api/events/{eventId}/attendees/{attendeeId}
      const response = await apiRequest(`${API_URL}/events/${eventId}/attendees/${attendeeId}`, {
        method: 'DELETE',

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const message = await response.text();

        throw new Error(message || `Failed to remove participant. Status: ${response.status}`);
      }

      //Remove participant from state.
      setParticipants((previous) =>
        previous.filter(
          (participant) =>
            !(participant.eventId === eventId && participant.attendeeId === attendeeId),
        ),
      );
    } catch (error) {
      console.error('Error removing participant:', error);

      setError(error instanceof Error ? error.message : 'Unable to remove participant.');
    }
  };

  const registeredEventCount = new Set(participants.map((participant) => participant.eventId)).size;

  //Tailwind style classes.

  const inputClass =
    'w-full rounded-lg border border-border-default bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20';

  const primaryButtonClass =
    'rounded-lg bg-brand-primary px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50';

  const secondaryButtonClass =
    'rounded-lg border border-border-default bg-white px-4 py-2 text-sm font-medium text-text-secondary transition hover:border-brand-primary hover:bg-surface-blue hover:text-brand-primary-hover';

  return (
    <div
      className="
        min-h-full
        page-canvas
        p-6
        md:p-8
      "
    >
      {/* PAGE HEADER */}
      <PageHeader
        title="Participants"
        description="Manage attendees and event registrations."
        action={
          <button
            type="button"
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-hover"
            onClick={openAddParticipant}
          >
            + Add Participant
          </button>
        }
      />

      <section
        className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
        aria-label="Participant summary"
      >
        <article className="glass-panel flex items-center gap-4 bg-white/75 p-4 sm:p-5">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-brand-primary"
            aria-hidden="true"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20m6-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7.5a4 4 0 0 1 0 7.5m1 3h1.5a4.5 4.5 0 0 1 4.5 4.5V20"
              />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium text-text-muted">Total participants</p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-text-primary">
              {attendees.length}
            </p>
          </div>
        </article>
        <article className="glass-panel flex items-center gap-4 bg-white/75 p-4 sm:p-5">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-100 text-accent-orange"
            aria-hidden="true"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <rect width="16" height="16" x="4" y="5" rx="2" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 3v4m8-4v4M4 10h16m-12 4h3m-3 3h6"
              />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium text-text-muted">Events with registrations</p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-text-primary">
              {registeredEventCount}
            </p>
          </div>
        </article>
      </section>
      {/* MAIN CONTENT CARD */}

      <div className="glass-panel w-full overflow-hidden">
        {/* ERROR MESSAGE */}

        {error && !showAddForm && (
          <div
            className="
              mx-6
              mt-6
              rounded-lg
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-700
            "
          >
            {error}
          </div>
        )}

        {/* ADD PARTICIPANT FORM */}

        <Modal
          open={showAddForm}
          ariaLabel="Add participant"
          onClose={() => setShowAddForm(false)}
          className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border-accent/40 bg-white shadow-2xl"
        >
          <form onSubmit={addParticipant}>
            <h3
              className="
                mb-5
                text-lg
                font-semibold
                text-text-primary
              "
            >
              Add Participant
            </h3>

            {error && (
              <p
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <div
              className="
                grid
                grid-cols-1
                gap-5
                md:grid-cols-2
              "
            >
              {/* NAME */}

              <FormField label="Name" className="gap-2" required>
                <input
                  type="text"
                  name="name"
                  value={attendeeForm.name}
                  onChange={handleAttendeeChange}
                  className={inputClass}
                  required
                />
              </FormField>

              {/* EMAIL */}

              <FormField label="Email" className="gap-2" required>
                <input
                  type="email"
                  name="email"
                  value={attendeeForm.email}
                  onChange={handleAttendeeChange}
                  className={inputClass}
                  required
                />
              </FormField>

              {/* PHONE */}

              <FormField label="Phone" className="gap-2" required>
                <input
                  type="text"
                  name="phone"
                  value={attendeeForm.phone}
                  onChange={handleAttendeeChange}
                  className={inputClass}
                  required
                />
              </FormField>

              {/* TICKET */}

              <FormField label="Ticket" className="gap-2" required>
                <input
                  type="text"
                  name="ticket"
                  value={attendeeForm.ticket}
                  onChange={handleAttendeeChange}
                  className={inputClass}
                  required
                />
              </FormField>

              {/* EVENT */}

              <FormField label="Event" className="gap-2" required>
                <select
                  name="eventId"
                  value={attendeeForm.eventId}
                  onChange={handleAttendeeChange}
                  className={inputClass}
                  required
                >
                  <option value="">Select event</option>

                  {events.map((event) => (
                    <option key={event.eventId} value={event.eventId}>
                      {event.eventName}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* FORM ACTIONS */}

            <div
              className="
                mt-6
                flex
                flex-wrap
                justify-end
                gap-3
              "
            >
              <button type="submit" className={primaryButtonClass} disabled={loading}>
                {loading ? 'Adding...' : 'Add Participant'}
              </button>
            </div>
          </form>
        </Modal>

        <div className="border-b border-border-subtle p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-text-primary">Attendee directory</h2>
            <p className="mt-1 text-sm text-text-muted">
              Search participants by name or email and filter by event.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SearchBar
              id="participantSearch"
              ariaLabel="Search participants by name or email"
              placeholder="Search participants..."
              value={searchTerm}
              onChange={setSearchTerm}
              fullWidth
            />
            <EventFilter
              id="participantEventFilter"
              ariaLabel="Filter participants by event"
              value={selectedEvent}
              events={events}
              onChange={setSelectedEvent}
            />
          </div>
        </div>

        <div
          className="max-h-[620px] space-y-2 overflow-y-auto p-4 sm:p-5"
          role="region"
          aria-label="Attendee registrations"
          tabIndex={0}
        >
          {loading ? (
            <div className="space-y-2" role="status" aria-label="Loading participants">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse items-center gap-3 rounded-xl border border-border-subtle bg-white/55 p-4"
                >
                  <span className="h-11 w-11 rounded-full bg-blue-100" />
                  <span className="h-4 w-48 max-w-[55%] rounded bg-slate-200" />
                </div>
              ))}
              <span className="sr-only">Loading participants...</span>
            </div>
          ) : error ? (
            <div
              className="rounded-xl border border-red-200 bg-red-50/80 px-5 py-8 text-center"
              role="alert"
            >
              <h3 className="font-semibold text-red-700">Unable to load the attendee directory</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-blue-200 bg-white/55 px-5 py-10 text-center">
              <span
                className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-blue-100 text-brand-primary"
                aria-hidden="true"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="8" r="4" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 21v-1a8 8 0 0 1 16 0v1m1-13 2 2m0-2-2 2"
                  />
                </svg>
              </span>
              <h3 className="mt-3 font-semibold text-text-primary">No participants found</h3>
              <p className="mt-1 text-sm text-text-muted">
                Try another search or event filter. Registered attendees will appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {filteredParticipants.map((participant) => {
                const actionKey = `${participant.eventId}-${participant.attendeeId}`;
                const initials =
                  participant.name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part.charAt(0))
                    .join('')
                    .toUpperCase() || 'AT';

                return (
                  <li
                    key={actionKey}
                    className="group flex min-w-0 items-center gap-3 rounded-xl border border-border-subtle bg-white/70 p-3 shadow-sm transition hover:border-brand-primary/35 hover:bg-white/90 hover:shadow-md sm:gap-4 sm:px-4"
                  >
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-brand-primary ring-1 ring-blue-200"
                      aria-hidden="true"
                    >
                      {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-text-primary">
                        {participant.name}
                      </p>
                      <p className="truncate text-sm text-text-secondary">{participant.email}</p>
                      <p className="mt-1 truncate text-sm font-medium text-text-primary">
                        Registered for{' '}
                        <span className="text-text-primary">{participant.eventName}</span>
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 sm:px-3">
                      {participant.registeredAt}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${participant.name} from ${participant.eventName}`}
                      title="Remove participant"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      onClick={() =>
                        void removeParticipant(participant.eventId, participant.attendeeId)
                      }
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18M8 6V4h8v2m2 0-1 14H7L6 6m4 4v6m4-6v6" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default ParticipantsPage;
