import { useEffect, useState, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import DashboardSummaryCards from '../Components/DashboardSummaryCards';
import UpcomingEventsPanel from '../Components/UpcomingEventsPanel';
import DashboardCalendarPanel from '../Components/DashboardCalendarPanel';
type EventStatus = 'Scheduled' | 'Cancelled' | 'Completed';
interface EventDto {
    eventId: number;
    eventName: string;
    startDate: string;
    endDate: string;
    budget?: number | null;
    eventType: number;
    status: EventStatus | number;
    venueId?: number | null;
    orgId?: number | null;
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
interface EventFormData {
    eventName: string;
    eventType: string;
    startDate: string;
    endDate: string;
    venueId: string;
    orgId: string;
    budget: string;
}
const emptyForm: EventFormData = {
    eventName: '',
    eventType: '0',
    startDate: '',
    endDate: '',
    venueId: '',
    orgId: '',
    budget: '',
};
function toDateTimeLocal(value: string | Date): string {
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
function getObjectId(obj: Record<string, unknown>, ...keys: string[]): number {
    for (const key of keys) {
        const value = obj[key];
        if (typeof value === 'number' && Number.isInteger(value)) {
            return value;
        }
        if (typeof value === 'string' &&
            value.trim() !== '' &&
            Number.isInteger(Number(value))) {
            return Number(value);
        }
    }
    return 0;
}
function getObjectString(obj: Record<string, unknown>, ...keys: string[]): string {
    for (const key of keys) {
        const value = obj[key];
        if (typeof value === 'string' && value.trim() !== '') {
            return value;
        }
    }
    return '';
}
function Dashboard() {
    const { instance, accounts } = useMsal();
    const account = instance.getActiveAccount() ?? accounts[0];
    const accountId = account?.homeAccountId;
    const roles = (account?.idTokenClaims?.roles as string[]) ?? [];
    const canManageEvents = roles.includes('Admin') || roles.includes('Employee');
    const isAttendee = roles.includes('Attendee');
    const API_SCOPE = 'api://0332cc25-1dc3-4542-b1cd-a1ad23d0f620/access_as_user';
    const [events, setEvents] = useState<EventDto[]>([]);
    const [venues, setVenues] = useState<VenueOption[]>([]);
    const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showEventForm, setShowEventForm] = useState(false);
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [formData, setFormData] = useState<EventFormData>(emptyForm);
    const [savingEvent, setSavingEvent] = useState(false);
    const [attendeeEventPopup, setAttendeeEventPopup] = useState<{
        event: EventDto;
        top: number;
        left: number;
    } | null>(null);
    const [reregisteringEventId, setReregisteringEventId] = useState<number | null>(null);
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const getAccessToken = useCallback(async () => {
        const activeAccount = instance.getActiveAccount() ?? account;
        if (!activeAccount) {
            throw new Error('Please sign in before performing this action.');
        }
        const result = await instance.acquireTokenSilent({
            scopes: [API_SCOPE],
            account: activeAccount,
        });
        return result.accessToken;
    }, [accountId, instance]);
    const loadEvents = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            let response: Response;
            if (isAttendee) {
                const token = await getAccessToken();
                response = await fetch('/api/events/my-registrations', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            }
            else {
                response = await fetch('/api/events');
            }
            if (!response.ok) {
                throw new Error(`Failed to load events (${response.status}).`);
            }
            const data: EventDto[] = await response.json();
            setEvents(data);
        }
        catch (err) {
            console.error('Error loading events:', err);
            setError(err instanceof Error ? err.message : 'Unable to load events.');
        }
        finally {
            setLoading(false);
        }
    }, [getAccessToken, isAttendee]);
    useEffect(() => {
        void loadEvents();
    }, [loadEvents]);
    // Load venue and organization records through their API endpoints.
    useEffect(() => {
        let active = true;
        const loadDropdowns = async () => {
            try {
                const [venueResponse, organizationResponse] = await Promise.all([
                    fetch('/api/venues'),
                    fetch('/api/organizations'),
                ]);
                if (!venueResponse.ok) {
                    throw new Error(`Failed to load venues (${venueResponse.status}).`);
                }
                if (!organizationResponse.ok) {
                    throw new Error(`Failed to load organizations (${organizationResponse.status}).`);
                }
                const venueJson: unknown = await venueResponse.json();
                const organizationJson: unknown = await organizationResponse.json();
                if (!Array.isArray(venueJson)) {
                    throw new Error('The venues API did not return a list.');
                }
                if (!Array.isArray(organizationJson)) {
                    throw new Error('The organizations API did not return a list.');
                }
                const venueData: VenueOption[] = venueJson
                    .map((item: unknown) => {
                    const obj = item as Record<string, unknown>;
                    return {
                        venueId: getObjectId(obj, 'venueId', 'VenueId', 'id', 'Id'),
                        venueName: getObjectString(obj, 'venueName', 'VenueName', 'address', 'Address', 'name', 'Name'),
                    };
                })
                    .filter(venue => venue.venueId > 0 && venue.venueName !== '');
                const organizationData: OrganizationOption[] = organizationJson
                    .map((item: unknown) => {
                    const obj = item as Record<string, unknown>;
                    return {
                        orgId: getObjectId(obj, 'orgId', 'OrgId', 'organizationId', 'OrganizationId', 'id', 'Id'),
                        orgName: getObjectString(obj, 'orgName', 'OrgName', 'organizationName', 'OrganizationName', 'name', 'Name'),
                    };
                })
                    .filter(organization => organization.orgId > 0 && organization.orgName !== '');
                console.log('Venue options received:', venueData);
                console.log('Organization options received:', organizationData);
                if (active) {
                    setVenues(venueData);
                    setOrganizations(organizationData);
                    if (venueData.length === 0) {
                        console.warn('No venue options were mapped. Check the VenueResponseDto property names and API response.');
                    }
                    if (organizationData.length === 0) {
                        console.warn('No organization options were mapped. Check the OrganizationResponseDto property names and API response.');
                    }
                }
            }
            catch (err) {
                console.error('Failed to load dropdowns:', err);
                if (active) {
                    setError(err instanceof Error
                        ? err.message
                        : 'Unable to load venues and organizations.');
                }
            }
        };
        void loadDropdowns();
        return () => {
            active = false;
        };
    }, []);
    useEffect(() => {
        const refresh = () => void loadEvents();
        const visibility = () => {
            if (document.visibilityState === 'visible') {
                refresh();
            }
        };
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', visibility);
        return () => {
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', visibility);
        };
    }, [loadEvents]);
    const getEventStatus = (status: EventStatus | number): EventStatus => {
        if (typeof status === 'number') {
            if (status === 1)
                return 'Cancelled';
            if (status === 2)
                return 'Completed';
            return 'Scheduled';
        }
        return status;
    };
    const schedulerEvents = events
        .filter(event => getEventStatus(event.status) !== 'Cancelled')
        .map(event => ({
        Id: event.eventId,
        Subject: event.eventName,
        StartTime: new Date(event.startDate),
        EndTime: new Date(event.endDate),
        Status: getEventStatus(event.status),
        isRegistrationCancelled: event.isRegistrationCancelled ?? false,
    }));
    const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
    const openCreateEvent = () => {
        if (!canManageEvents)
            return;
        const start = selectedDate ? new Date(selectedDate) : new Date();
        start.setHours(9, 0, 0, 0);
        const end = new Date(start);
        end.setHours(end.getHours() + 1);
        setEditingEventId(null);
        setFormData({
            ...emptyForm,
            startDate: toDateTimeLocal(start),
            endDate: toDateTimeLocal(end),
        });
        setError('');
        setShowEventForm(true);
    };
    const openEditEvent = (eventId: number) => {
        if (!canManageEvents)
            return;
        const event = events.find(item => item.eventId === eventId);
        if (!event) {
            setError('Event not found. Please refresh and try again.');
            return;
        }
        const status = getEventStatus(event.status);
        if (status === 'Cancelled' || status === 'Completed') {
            setError(status === 'Completed' ? 'Completed events cannot be edited.' : 'Cancelled events cannot be edited.');
            return;
        }
        setEditingEventId(eventId);
        setFormData({
            eventName: event.eventName,
            eventType: String(event.eventType ?? 0),
            startDate: toDateTimeLocal(event.startDate),
            endDate: toDateTimeLocal(event.endDate),
            venueId: event.venueId == null ? '' : String(event.venueId),
            orgId: event.orgId == null ? '' : String(event.orgId),
            budget: event.budget == null ? '' : String(event.budget),
        });
        setError('');
        setShowEventForm(true);
    };
    const closeEventForm = () => {
        if (savingEvent)
            return;
        setShowEventForm(false);
        setEditingEventId(null);
        setFormData(emptyForm);
    };
    const saveCalendarEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canManageEvents) {
            setError('You do not have permission to manage events.');
            return;
        }
        if (editingEventId !== null) {
            const eventBeingEdited = events.find(item => item.eventId === editingEventId);
            if (!eventBeingEdited || getEventStatus(eventBeingEdited.status) !== 'Scheduled') {
                setError('Only scheduled events can be edited.');
                return;
            }
        }
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const venueId = Number(formData.venueId);
        const orgId = formData.orgId ? Number(formData.orgId) : null;
        const budget = formData.budget ? Number(formData.budget) : null;
        const eventType = Number(formData.eventType);
        if (!formData.eventName.trim() || !formData.venueId) {
            setError('Event name and venue are required.');
            return;
        }
        if (Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime()) ||
            endDate <= startDate) {
            setError('Enter valid dates. The end must be after the start.');
            return;
        }
        if (!Number.isInteger(venueId) || venueId <= 0) {
            setError('Please select a valid venue.');
            return;
        }
        if (orgId !== null &&
            (!Number.isInteger(orgId) || orgId <= 0)) {
            setError('Please select a valid organization.');
            return;
        }
        if (budget !== null &&
            (!Number.isFinite(budget) || budget < 0)) {
            setError('Budget must be zero or greater.');
            return;
        }
        if (!Number.isInteger(eventType) || eventType < 0 || eventType > 5) {
            setError('Please select a valid event type.');
            return;
        }
        try {
            setSavingEvent(true);
            setError('');
            const token = await getAccessToken();
            const isEditing = editingEventId !== null;
            const payload = {
                eventName: formData.eventName.trim(),
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                venueId,
                budget,
                eventType,
                orgId,
            };
            const response = await fetch(isEditing ? `/api/events/${editingEventId}` : '/api/events', {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const message = await response.text();
                throw new Error(message ||
                    `Unable to ${isEditing ? 'update' : 'create'} event (${response.status}).`);
            }
            setShowEventForm(false);
            setEditingEventId(null);
            setFormData(emptyForm);
            await loadEvents();
        }
        catch (err) {
            console.error('Save event failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to save event.');
        }
        finally {
            setSavingEvent(false);
        }
    };
    const cancelCalendarEvent = async (eventId: number) => {
        if (!canManageEvents) {
            setError('You do not have permission to cancel events.');
            return;
        }
        const event = events.find(item => item.eventId === eventId);
        if (!event) {
            setError('Event not found. Refresh the calendar and try again.');
            return;
        }
        if (getEventStatus(event.status) === 'Cancelled') {
            setError('This event is already cancelled.');
            return;
        }
        if (!window.confirm(`Cancel "${event.eventName}"? The event will remain in the database.`)) {
            return;
        }
        try {
            setError('');
            const token = await getAccessToken();
            const response = await fetch(`/api/events/${eventId}/cancel`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || `Unable to cancel event (${response.status}).`);
            }
            setShowEventForm(false);
            setEditingEventId(null);
            setFormData(emptyForm);
            await loadEvents();
        }
        catch (err) {
            console.error('Cancel event failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to cancel event.');
        }
    };
    // Use explicit popup actions rather than Syncfusion's delete behavior.
    const handlePopupOpen = (args: any) => {
        if (args.type !== 'QuickInfo')
            return;
        const eventId = Number(args.data?.Id ?? args.data?.EventId ?? args.data?.eventId);
        // QuickInfo without an existing event is the scheduler's empty-cell
        // create popup. Event creation should only happen through Add Event.
        if (!Number.isInteger(eventId) || eventId <= 0) {
            args.cancel = true;
            return;
        }
        if (isAttendee) {
            args.cancel = true;
            const event = events.find(item => item.eventId === eventId);
            if (event) {
                const target = args.target as HTMLElement | undefined;
                const rect = target?.getBoundingClientRect();
                const popupWidth = 320;
                const popupHeight = 230;
                const left = rect
                    ? rect.right + popupWidth + 16 <= window.innerWidth
                        ? rect.right + 8
                        : Math.max(16, rect.left - popupWidth - 8)
                    : 16;
                const top = rect
                    ? Math.min(Math.max(16, rect.top), window.innerHeight - popupHeight - 16)
                    : 16;
                setAttendeeEventPopup({ event, top, left });
            }
            else {
                setAttendeeEventPopup(null);
            }
            return;
        }
        if (!canManageEvents)
            return;
        window.setTimeout(() => {
            const popup = document.querySelector<HTMLElement>('.e-quick-popup-wrapper');
            if (!popup)
                return;
            const event = events.find(item => item.eventId === eventId);
            const removePopupActions = () => {
                popup.querySelectorAll<HTMLElement>('.e-event-edit, .e-edit, .e-event-delete, .e-delete, [title="Edit"], [aria-label="Edit"], [title="Delete"], [aria-label="Delete"]').forEach(button => button.remove());
                popup.querySelectorAll<HTMLElement>('button, .e-btn').forEach(button => {
                    if (['edit', 'delete'].includes(button.textContent?.trim().toLowerCase() ?? '')) {
                        button.remove();
                    }
                });
            };
            removePopupActions();
            const popupObserver = new MutationObserver(removePopupActions);
            popupObserver.observe(popup, { childList: true, subtree: true });
            window.setTimeout(() => popupObserver.disconnect(), 5000);
            if (!event || getEventStatus(event.status) !== 'Scheduled')
                return;
            if (popup.querySelector('[data-custom-cancel-event="true"]')) {
                return;
            }
            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.textContent = 'Cancel Event';
            cancelButton.setAttribute('data-custom-cancel-event', 'true');
            cancelButton.className = 'e-btn e-flat e-primary';
            cancelButton.style.margin = '8px';
            cancelButton.style.color = '#dc2626';
            cancelButton.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                void cancelCalendarEvent(eventId);
            });
            const footer = popup.querySelector<HTMLElement>('.e-footer-content');
            (footer ?? popup).appendChild(cancelButton);
        }, 0);
    };
    const monthEvents = events.filter(event => {
        if (getEventStatus(event.status) === 'Cancelled')
            return false;
        const date = new Date(event.startDate);
        return (date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear);
    });
    const scheduledEvents = events.filter(event => getEventStatus(event.status) === 'Scheduled' && !event.isRegistrationCancelled);
    const cancelledEvents = events.filter(event => getEventStatus(event.status) === 'Cancelled');
    const upcomingEvents = events
        .filter(event => getEventStatus(event.status) === 'Scheduled' && !event.isRegistrationCancelled &&
        new Date(event.startDate) >= new Date())
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 5);
    const applySelectedDateStyle = useCallback(() => {
        const cells = document.querySelectorAll<HTMLElement>('.dashboard-calendar .e-work-cells');
        cells.forEach(cell => {
            cell.style.outline = '';
            cell.style.outlineOffset = '';
            cell.style.boxShadow = '';
            cell.style.backgroundColor = '';
            const dateValue = cell.getAttribute('data-date');
            if (!selectedDate || !dateValue)
                return;
            if (isSameDay(new Date(Number(dateValue)), selectedDate)) {
                cell.style.outline = '2px solid #8b5cf6';
                cell.style.outlineOffset = '-2px';
                cell.style.backgroundColor = '#f5f3ff';
            }
        });
    }, [selectedDate]);
    useEffect(() => {
        const timeoutId = window.setTimeout(applySelectedDateStyle, 50);
        return () => window.clearTimeout(timeoutId);
    }, [applySelectedDateStyle, currentDate, loading]);
    const handleCellClick = (args: {
        startTime: Date;
    }) => {
        setSelectedDate(args.startTime);
    };
    // Prevent double-clicking empty cells from opening the default editor.
    const handleCellDoubleClick = (args: any) => {
        args.cancel = true;
    };
    // Double-clicking an existing event opens our custom edit form.
    const handleEventDoubleClick = (args: any) => {
        args.cancel = true;
        const eventId = Number(args.event?.Id ??
            args.event?.EventId ??
            args.event?.eventId ??
            args.data?.Id);
        const event = events.find(item => item.eventId === eventId);
        if (Number.isInteger(eventId) &&
            eventId > 0 &&
            event &&
            getEventStatus(event.status) === 'Scheduled') {
            openEditEvent(eventId);
        }
    };
    const handleEventRendered = (args: any) => {
        if (args.data?.isRegistrationCancelled) {
            args.element.style.setProperty('background-color', '#ffedd5', 'important');
            args.element.style.setProperty('border-color', '#fdba74', 'important');
            args.element.style.setProperty('color', '#9a3412', 'important');
            args.element.querySelectorAll<HTMLElement>('*').forEach(child => {
                child.style.setProperty('color', '#9a3412', 'important');
            });
            args.element.style.setProperty('opacity', '1', 'important');
            return;
        }
        if (args.data?.Status !== 'Completed')
            return;
        args.element.style.setProperty('background-color', '#ede9fe', 'important');
        args.element.style.setProperty('border-color', '#c4b5fd', 'important');
        args.element.style.setProperty('color', '#5b21b6', 'important');
        args.element.querySelectorAll<HTMLElement>('*').forEach(child => {
            child.style.setProperty('color', '#5b21b6', 'important');
        });
        args.element.style.setProperty('opacity', '1', 'important');
    };
    const reregisterForEvent = async (eventId: number) => {
        try {
            setReregisteringEventId(eventId);
            setError('');
            const token = await getAccessToken();
            const response = await fetch(`/api/events/${eventId}/register`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || 'Failed to re-register for this event.');
            }
            await loadEvents();
            setAttendeeEventPopup(null);
        }
        catch (err) {
            console.error('Event re-registration failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to re-register for this event.');
        }
        finally {
            setReregisteringEventId(null);
        }
    };
    const handleRenderCell = (args: {
        element: HTMLElement;
        date?: Date;
        type: string;
    }) => {
        if (args.type !== 'workCells' || !selectedDate || !args.date)
            return;
        if (isSameDay(args.date, selectedDate)) {
            args.element.style.boxShadow = 'inset 0 0 0 2px #8b5cf6';
            args.element.style.backgroundColor = '#f5f3ff';
        }
    };
    const formatTime = (date: string) => new Date(date).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
    });
    const formatDisplayDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    const userName = account?.name || account?.username || 'User';
    return (<div className="min-h-[calc(100vh-68px)] w-full bg-[#edf3fb] px-[46px] pt-9 pb-[60px] max-[1150px]:px-[25px] max-[700px]:px-[15px]">

    <header className="mx-auto mb-[34px] w-full max-w-[1400px] text-center">

    <p className="mt-3 text-[17px] text-[#6b7280]">

Welcome back! Here's what's happening with your events.

    </p>

    <p className="mt-[14px] text-[#374151]">

Welcome, <strong>{userName}</strong>

    </p>

    </header>

    <main className="mx-auto w-full max-w-[1400px]">

    <DashboardSummaryCards total={events.length} scheduled={scheduledEvents.length} cancelled={cancelledEvents.length} upcoming={upcomingEvents.length}/>

        {error && (<div className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

        <span>{error}</span>

        <button type="button" onClick={() => setError('')} aria-label="Dismiss error">

×

        </button>

        </div>)}

    <section className="grid grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)] items-start gap-6 max-[1150px]:grid-cols-1">

    <DashboardCalendarPanel monthEventCount={monthEvents.length} selectedDate={selectedDate} currentDate={currentDate} schedulerEvents={schedulerEvents} loading={loading} canManageEvents={canManageEvents} isAttendee={isAttendee} venues={venues} organizations={organizations} attendeeEventPopup={attendeeEventPopup} showEventForm={showEventForm} editingEventId={editingEventId} savingEvent={savingEvent} formData={formData} onSetCurrentDate={setCurrentDate} onClearSelectedDate={() => setSelectedDate(null)} onCreateEvent={openCreateEvent} onEventRendered={handleEventRendered} onCellClick={handleCellClick} onCellDoubleClick={handleCellDoubleClick} onEventDoubleClick={handleEventDoubleClick} onPopupOpen={handlePopupOpen} onRenderCell={handleRenderCell} onCloseAttendeePopup={() => setAttendeeEventPopup(null)} onReregister={reregisterForEvent} reregisteringEventId={reregisteringEventId} formatDisplayDate={formatDisplayDate} formatTime={formatTime} onCloseEventForm={closeEventForm} onSaveEvent={saveCalendarEvent} onFormChange={(field, value) => setFormData((current) => ({ ...current, [field]: value }))}/>

    <UpcomingEventsPanel events={upcomingEvents} loading={loading} formatDate={formatDisplayDate} formatTime={formatTime}/>

    </section>

    </main>

    </div>);
}
export default Dashboard;
