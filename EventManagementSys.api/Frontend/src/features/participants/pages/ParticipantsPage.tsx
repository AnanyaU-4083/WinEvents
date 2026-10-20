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
        void attendeeData;

        if (cancelled) {
          return;
        }

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
          className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border-accent/40 bg-white p-6 shadow-2xl"
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
              <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

        {/* FILTERS */}

        <div className="grid grid-cols-1 gap-3 border-b border-border-subtle p-6 md:grid-cols-2">
          <SearchBar value={searchTerm} onChange={setSearchTerm} fullWidth />
          <EventFilter value={selectedEvent} events={events} onChange={setSelectedEvent} />
        </div>
        {/* TABLE */}

        <div
          className="
            w-full
            overflow-x-auto
          "
        >
          <table
            className="
              table-grid
              min-w-full
              border-collapse
              text-left
              text-sm
            "
          >
            <thead>
              <tr>
                <th
                  className="
                    whitespace-nowrap
                    bg-surface-subtle
                    px-5
                    py-3
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-text-muted
                  "
                >
                  Attendee
                </th>

                <th
                  className="
                    whitespace-nowrap
                    bg-surface-subtle
                    px-5
                    py-3
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-text-muted
                  "
                >
                  Email
                </th>

                <th
                  className="
                    whitespace-nowrap
                    bg-surface-subtle
                    px-5
                    py-3
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-text-muted
                  "
                >
                  Event
                </th>

                <th
                  className="
                    whitespace-nowrap
                    bg-surface-subtle
                    px-5
                    py-3
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-text-muted
                  "
                >
                  Registration
                </th>

                <th
                  className="
                    whitespace-nowrap
                    bg-surface-subtle
                    px-5
                    py-3
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-text-muted
                  "
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {/* LOADING */}

              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="
                      border-t
                      border-border-subtle
                    "
                  >
                    <div
                      className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        px-6
                        py-12
                        text-center
                      "
                    >
                      <h3
                        className="
                          text-base
                          font-semibold
                          text-text-primary
                        "
                      >
                        Loading participants...
                      </h3>

                      <p
                        className="
                          mt-2
                          text-sm
                          text-text-muted
                        "
                      >
                        Please wait while participants are loaded.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                /* ERROR */

                <tr>
                  <td
                    colSpan={5}
                    className="
                      border-t
                      border-border-subtle
                    "
                  >
                    <div
                      className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        px-6
                        py-12
                        text-center
                      "
                    >
                      <h3
                        className="
                          text-base
                          font-semibold
                          text-red-600
                        "
                      >
                        {error}
                      </h3>
                    </div>
                  </td>
                </tr>
              ) : filteredParticipants.length === 0 ? (
                /* EMPTY */

                <tr>
                  <td
                    colSpan={5}
                    className="
                      border-t
                      border-border-subtle
                    "
                  >
                    <div
                      className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        px-6
                        py-12
                        text-center
                      "
                    >
                      <h3
                        className="
                          text-base
                          font-semibold
                          text-text-primary
                        "
                      >
                        No participants found
                      </h3>

                      <p
                        className="
                          mt-2
                          text-sm
                          text-text-muted
                        "
                      >
                        Registered attendees will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                /* PARTICIPANTS */

                filteredParticipants.map((participant) => (
                  <tr
                    key={`${participant.eventId}-${participant.attendeeId}`}
                    className="
                        transition
                        hover:bg-surface-muted
                      "
                  >
                    <td
                      className="
                          border-t
                          border-border-subtle
                          px-5
                          py-4
                          text-sm
                          font-medium
                          text-text-primary
                        "
                    >
                      {participant.name}
                    </td>

                    <td
                      className="
                          border-t
                          border-border-subtle
                          px-5
                          py-4
                          text-sm
                          text-text-secondary
                        "
                    >
                      {participant.email}
                    </td>

                    <td
                      className="
                          border-t
                          border-border-subtle
                          px-5
                          py-4
                          text-sm
                          text-text-secondary
                        "
                    >
                      {participant.eventName}
                    </td>

                    <td
                      className="
                          border-t
                          border-border-subtle
                          px-5
                          py-4
                          text-sm
                          text-text-muted
                        "
                    >
                      {participant.registeredAt}
                    </td>

                    <td
                      className="
                          border-t
                          border-border-subtle
                          px-5
                          py-4
                        "
                    >
                      <button
                        type="button"
                        aria-label="Remove participant"
                        title="Remove participant"
                        className="grid h-8 w-8 place-items-center rounded-lg border border-surface-error bg-white p-0 text-state-error transition hover:bg-surface-error"
                        onClick={() =>
                          removeParticipant(participant.eventId, participant.attendeeId)
                        }
                      >
                        <svg
                          aria-hidden="true"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          viewBox="0 0 24 24"
                        >
                          <path d="M3 6h18M8 6V4h8v2m2 0-1 14H7L6 6m4 4v6m4-6v6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ParticipantsPage;
