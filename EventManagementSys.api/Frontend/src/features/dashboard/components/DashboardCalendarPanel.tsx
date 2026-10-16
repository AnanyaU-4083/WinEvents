import type { FormEventHandler } from 'react';
import {
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  Inject,
  Month,
  Week,
  WorkWeek,
  Day,
  Agenda,
} from '@syncfusion/ej2-react-schedule';
import FormField from '@/shared/components/FormField';
import Modal from '@/shared/components/Modal';
import AttendeeEventPopup from './AttendeeEventPopup';

interface CalendarEvent {
  eventId: number;
  eventName: string;
  startDate: string;
  endDate: string;
  eventType: number;
  status: string | number;
  venueId?: number | null;
  orgId?: number | null;
  budget?: number | null;
  isRegistrationCancelled?: boolean;
}

interface VenueOption {
  venueId: number;
  venueName: string;
}

interface OrganizationOption {
  orgId: number;
  orgName: string;
}

interface CalendarEventForm {
  eventName: string;
  eventType: string;
  startDate: string;
  endDate: string;
  venueId: string;
  orgId: string;
  budget: string;
}

export interface DashboardCalendarPanelProps {
  monthEventCount: number;
  selectedDate: Date | null;
  currentDate: Date;
  schedulerEvents: Record<string, unknown>[];
  loading: boolean;
  canManageEvents: boolean;
  isAttendee: boolean;
  venues: VenueOption[];
  organizations: OrganizationOption[];
  attendeeEventPopup: { event: CalendarEvent; top: number; left: number } | null;
  showEventForm: boolean;
  editingEventId: number | null;
  savingEvent: boolean;
  formData: CalendarEventForm;
  onSetCurrentDate: (date: Date) => void;
  onClearSelectedDate: () => void;
  onCreateEvent: () => void;
  onEventRendered: (args: { data: Record<string, unknown>; element: HTMLElement }) => void;
  onCellClick: (args: { startTime: Date }) => void;
  onCellDoubleClick: (args: { cancel: boolean }) => void;
  onEventDoubleClick: (args: {
    cancel: boolean;
    event?: unknown;
    data?: Record<string, unknown>;
  }) => void;
  onPopupOpen: (args: {
    type: string;
    data?: Record<string, unknown>;
    cancel: boolean;
    target?: Element;
  }) => void;
  onRenderCell: (args: { element: HTMLElement; date?: Date; type: string }) => void;
  onCloseAttendeePopup: () => void;
  onReregister: (eventId: number) => void;
  reregisteringEventId: number | null;
  formatDisplayDate: (date: string) => string;
  formatTime: (date: string) => string;
  onCloseEventForm: () => void;
  onSaveEvent: FormEventHandler<HTMLFormElement>;
  onFormChange: (field: keyof CalendarEventForm, value: string) => void;
}

function DashboardCalendarPanel({
  monthEventCount,
  selectedDate,
  currentDate,
  schedulerEvents,
  loading,
  canManageEvents,
  isAttendee,
  venues,
  organizations,
  attendeeEventPopup,
  showEventForm,
  editingEventId,
  savingEvent,
  formData,
  onSetCurrentDate,
  onClearSelectedDate,
  onCreateEvent,
  onEventRendered,
  onCellClick,
  onCellDoubleClick,
  onEventDoubleClick,
  onPopupOpen,
  onRenderCell,
  onCloseAttendeePopup,
  onReregister,
  reregisteringEventId,
  formatDisplayDate,
  formatTime,
  onCloseEventForm,
  onSaveEvent,
  onFormChange,
}: DashboardCalendarPanelProps) {
  return (
    <div className="w-full rounded-panel border border-border-accent/45 bg-surface-blue-sheer/25 p-6 shadow-panel backdrop-blur-md">
      <div className="mb-5 flex items-center justify-between gap-4 max-[700px]:flex-col max-[700px]:items-start">
        <div>
          <h2 className="m-0 text-xl font-bold text-text-primary">Event Calendar</h2>
          <p className="mt-1 text-sm text-text-muted">
            {monthEventCount} event{monthEventCount === 1 ? '' : 's'} this month
          </p>
          {selectedDate && (
            <p className="mt-1 text-sm text-blue-strong">
              Selected date:{' '}
              {selectedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
        {canManageEvents && (
          <button
            type="button"
            onClick={onCreateEvent}
            className="shrink-0 rounded-lg bg-accent-orange px-4 py-2.5 font-semibold text-white hover:bg-accent-orange-hover"
          >
            + Add Event
          </button>
        )}
      </div>

      <div className="rounded-lg border border-border-accent/60">
        {loading ? (
          <p className="py-10 text-center text-sm text-text-muted">Loading events...</p>
        ) : (
          <ScheduleComponent
            cssClass="dashboard-calendar"
            height="650px"
            selectedDate={currentDate}
            currentView="Month"
            readonly={!canManageEvents}
            showQuickInfo={true}
            eventSettings={{ dataSource: schedulerEvents }}
            eventRendered={onEventRendered}
            cellClick={onCellClick}
            cellDoubleClick={onCellDoubleClick}
            eventDoubleClick={onEventDoubleClick}
            popupOpen={onPopupOpen}
            renderCell={onRenderCell}
            navigating={(args) => {
              if (args.currentDate) {
                onSetCurrentDate(args.currentDate);
                onClearSelectedDate();
              }
            }}
          >
            <ViewsDirective>
              <ViewDirective option="Month" />
              <ViewDirective option="Week" />
              <ViewDirective option="WorkWeek" />
              <ViewDirective option="Day" />
              <ViewDirective option="Agenda" />
            </ViewsDirective>
            <Inject services={[Month, Week, WorkWeek, Day, Agenda]} />
          </ScheduleComponent>
        )}
      </div>

      {attendeeEventPopup && isAttendee && (
        <AttendeeEventPopup
          event={attendeeEventPopup.event}
          top={attendeeEventPopup.top}
          left={attendeeEventPopup.left}
          location={
            venues.find((venue) => venue.venueId === attendeeEventPopup.event.venueId)?.venueName ??
            'Location unavailable'
          }
          formatDate={formatDisplayDate}
          formatTime={formatTime}
          onClose={onCloseAttendeePopup}
          onReregister={() => onReregister(attendeeEventPopup.event.eventId)}
          reregistering={reregisteringEventId === attendeeEventPopup.event.eventId}
        />
      )}

      {showEventForm && canManageEvents && (
        <div className={editingEventId !== null ? 'contents' : 'mt-6'}>
          <Modal
            open={editingEventId !== null}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border-accent/35 bg-white/40 p-5 shadow-panel backdrop-blur-md"
            ariaLabel={editingEventId === null ? 'Create event' : 'Edit event'}
          >
            <EventFormContents
              editingEventId={editingEventId}
              savingEvent={savingEvent}
              formData={formData}
              venues={venues}
              organizations={organizations}
              onClose={onCloseEventForm}
              onSave={onSaveEvent}
              onFormChange={onFormChange}
            />
          </Modal>
          {editingEventId === null && (
            <div className="rounded-xl border border-border-default bg-surface-card p-5">
              <EventFormContents
                editingEventId={editingEventId}
                savingEvent={savingEvent}
                formData={formData}
                venues={venues}
                organizations={organizations}
                onClose={onCloseEventForm}
                onSave={onSaveEvent}
                onFormChange={onFormChange}
              />
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-text-muted">
        {canManageEvents
          ? 'Use Add Event to create an event. Open an event popup to edit or cancel it. Double-click an existing event to edit it.'
          : 'Select a calendar event to view it.'}
      </p>
    </div>
  );
}

interface EventFormContentsProps {
  editingEventId: number | null;
  savingEvent: boolean;
  formData: CalendarEventForm;
  venues: VenueOption[];
  organizations: OrganizationOption[];
  onClose: () => void;
  onSave: FormEventHandler<HTMLFormElement>;
  onFormChange: (field: keyof CalendarEventForm, value: string) => void;
}

function EventFormContents({
  editingEventId,
  savingEvent,
  formData,
  venues,
  organizations,
  onClose,
  onSave,
  onFormChange,
}: EventFormContentsProps) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-text-primary">
          {editingEventId === null ? 'Create Event' : 'Edit Event'}
        </h3>
        <button
          type="button"
          disabled={savingEvent}
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          Close
        </button>
      </div>

      <form onSubmit={onSave} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Event name">
          <input
            required
            value={formData.eventName}
            onChange={(e) => onFormChange('eventName', e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2"
          />
        </FormField>
        <FormField label="Event type">
          <select
            required
            value={formData.eventType}
            onChange={(e) => onFormChange('eventType', e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2"
          >
            <option value="0">Conference</option>
            <option value="1">Workshop</option>
            <option value="2">Webinar</option>
            <option value="3">Cultural Fest</option>
            <option value="4">Meeting</option>
            <option value="5">Product Launch</option>
          </select>
        </FormField>
        <FormField label="Start date and time">
          <input
            type="datetime-local"
            required
            value={formData.startDate}
            onChange={(e) => onFormChange('startDate', e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2"
          />
        </FormField>
        <FormField label="End date and time">
          <input
            type="datetime-local"
            required
            value={formData.endDate}
            onChange={(e) => onFormChange('endDate', e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2"
          />
        </FormField>
        <FormField label="Location">
          <select
            required
            value={formData.venueId}
            onChange={(e) => onFormChange('venueId', e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2"
          >
            <option value="">Select a venue</option>
            {venues.map((venue) => (
              <option key={venue.venueId} value={venue.venueId}>
                {venue.venueName}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Organization (optional)">
          <select
            value={formData.orgId}
            onChange={(e) => onFormChange('orgId', e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2"
          >
            <option value="">No organization</option>
            {organizations.map((organization) => (
              <option key={organization.orgId} value={organization.orgId}>
                {organization.orgName}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Budget (optional)" className="sm:col-span-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.budget}
            onChange={(e) => onFormChange('budget', e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2"
          />
        </FormField>
        <div className="flex gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={savingEvent}
            className="rounded-lg bg-accent-orange px-5 py-2.5 font-semibold text-white hover:bg-accent-orange-hover disabled:opacity-60"
          >
            {savingEvent ? 'Saving...' : editingEventId === null ? 'Create Event' : 'Save Changes'}
          </button>
          <button
            type="button"
            disabled={savingEvent}
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-semibold disabled:opacity-60"
          >
            Close
          </button>
        </div>
      </form>
    </>
  );
}

export default DashboardCalendarPanel;
