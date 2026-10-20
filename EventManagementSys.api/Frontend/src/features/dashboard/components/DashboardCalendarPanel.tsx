// Display events in calendar views.
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
import Modal from '@/shared/components/Modal';
import EventEditorForm from '@/features/events/components/EventEditorForm';
import type { EventFormData } from '@/features/events/schemas/eventFormSchema';
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
  address: string;
  capacity: number;
}

interface OrganizationOption {
  orgId: number;
  name: string;
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
  attendeeEventPopup: {
    event: CalendarEvent;
    top: number;
    left: number;
    isCompleted?: boolean;
  } | null;
  showEventForm: boolean;
  editingEventId: number | null;
  savingEvent: boolean;
  formData: EventFormData;
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
  onCancelEditingEvent?: () => void;
  onSaveEvent: (values: EventFormData) => void;
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
  onCancelEditingEvent,
  onSaveEvent,
}: DashboardCalendarPanelProps) {
  return (
    <div className="glass-panel glass-panel-blue w-full p-6">
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

      {attendeeEventPopup && (isAttendee || attendeeEventPopup.isCompleted) && (
        <AttendeeEventPopup
          event={attendeeEventPopup.event}
          isCompleted={attendeeEventPopup.isCompleted}
          top={attendeeEventPopup.top}
          left={attendeeEventPopup.left}
          location={
            venues.find((venue) => venue.venueId === attendeeEventPopup.event.venueId)?.address ??
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
        <Modal
          open={showEventForm}
          ariaLabel={editingEventId === null ? 'Create event' : 'Edit event'}
          onClose={onCloseEventForm}
          className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        >
          <EventEditorForm
            formData={formData}
            venues={venues}
            organizations={organizations}
            isEditing={editingEventId !== null}
            saving={savingEvent}
            onSubmit={onSaveEvent}
            onCancel={onCloseEventForm}
            onCancelEvent={onCancelEditingEvent}
          />
        </Modal>
      )}

      <p className="mt-3 text-xs text-text-muted">
        {canManageEvents
          ? 'Use Add Event to create an event. Open an event popup to edit or cancel it. Double-click an existing event to edit it.'
          : 'Select a calendar event to view it.'}
      </p>
    </div>
  );
}
export default DashboardCalendarPanel;
