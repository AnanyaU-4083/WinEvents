// Edit event details with validation.
import { useEffect, useRef, useState } from 'react';
import type { BaseSyntheticEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventFormSchema, type EventFormData } from '@/features/events/schemas/eventFormSchema';
import FormField from '@/shared/components/FormField';

interface VenueOption {
  venueId: number;
  address: string;
  capacity: number;
}

interface OrganizationOption {
  orgId: number;
  name: string;
}

interface EventEditorFormProps {
  formData: EventFormData;
  venues: VenueOption[];
  organizations: OrganizationOption[];
  isEditing: boolean;
  saving: boolean;
  onSubmit: (values: EventFormData, event?: BaseSyntheticEvent) => void;
  onCancel: () => void;
  onCancelEvent?: () => void;
}

const inputClass =
  'min-w-0 w-full rounded-xl border border-border-default bg-white/90 px-3 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-placeholder focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10';

const durationPresets = [
  { label: '15 minutes', hours: '0.25' },
  { label: '30 minutes', hours: '0.5' },
  { label: '45 minutes', hours: '0.75' },
  { label: '1 hour', hours: '1' },
  { label: '1.5 hours', hours: '1.5' },
  { label: '2 hours', hours: '2' },
  { label: '3 hours', hours: '3' },
  { label: '4 hours', hours: '4' },
  { label: '6 hours', hours: '6' },
  { label: '8 hours', hours: '8' },
  { label: '12 hours', hours: '12' },
  { label: '24 hours', hours: '24' },
  { label: '36 hours', hours: '36' },
  { label: '48 hours', hours: '48' },
];

function EventEditorForm({
  formData,
  venues,
  organizations,
  isEditing,
  saving,
  onSubmit,
  onCancel,
  onCancelEvent,
}: EventEditorFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: formData,
  });
  const [durationHours, setDurationHours] = useState('1');
  const [customDurationMode, setCustomDurationMode] = useState(false);
  const [durationError, setDurationError] = useState('');
  const endManuallyEdited = useRef(false);
  const isCustomDuration = customDurationMode;
  register('startDate');
  register('endDate');
  const startDateTime = watch('startDate') ?? '';
  const endDateTime = watch('endDate') ?? '';

  useEffect(() => {
    reset(formData);
    endManuallyEdited.current = false;
    setCustomDurationMode(false);
    setDurationError('');
    const start = new Date(formData.startDate).getTime();
    const end = new Date(formData.endDate).getTime();
    setDurationHours(
      Number.isFinite(start) && Number.isFinite(end) && end > start
        ? ((end - start) / 3600000).toString()
        : '1',
    );
  }, [formData, reset]);

  const updateEndFromDuration = (startValue: string, hoursValue: string) => {
    const start = new Date(startValue);
    const hours = Number(hoursValue);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(hours) || hours < 0.25) return;
    const end = new Date(start.getTime() + hours * 3600000);
    const offset = end.getTimezoneOffset() * 60000;
    setValue('endDate', new Date(end.getTime() - offset).toISOString().slice(0, 16), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const updateDateTimePart = (
    field: 'startDate' | 'endDate',
    part: 'date' | 'time',
    value: string,
  ) => {
    const [currentDate = '', currentTime = ''] = (getValues(field) ?? '').split('T');
    const date = part === 'date' ? value : currentDate;
    const time = part === 'time' ? value : currentTime;
    const combinedValue = date || time ? `${date}T${time}` : '';

    setValue(field, combinedValue, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (field === 'startDate') {
      if (!date || !time) return;
      if (endManuallyEdited.current) {
        const start = new Date(combinedValue).getTime();
        const end = new Date(getValues('endDate')).getTime();
        setDurationHours(
          Number.isFinite(start) && Number.isFinite(end) && end > start
            ? ((end - start) / 3600000).toString()
            : '',
        );
      } else {
        updateEndFromDuration(combinedValue, durationHours);
      }
      return;
    }

    endManuallyEdited.current = true;
    const start = new Date(getValues('startDate')).getTime();
    const end = new Date(combinedValue).getTime();
    const validDuration = Number.isFinite(start) && Number.isFinite(end) && end > start;
    setDurationHours(validDuration ? ((end - start) / 3600000).toString() : '');
    if (validDuration) setDurationError('');
  };

  const submitForm = handleSubmit((values, event) => {
    const duration = Number(durationHours);
    if (!Number.isFinite(duration) || duration < 0.25) {
      setDurationError('Duration must be at least 0.25 hours.');
      return;
    }
    setDurationError('');
    onSubmit(values, event);
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-white/35 bg-transparent shadow-none">
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-5 pr-14 sm:px-7 sm:py-6">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">
          {isEditing ? 'Edit Event' : 'Create Event'}
        </h2>
      </header>

      <form className="space-y-5 p-4 sm:p-7" onSubmit={submitForm}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Event Name" htmlFor="eventName" className="gap-2" required>
            <input
              className={inputClass}
              id="eventName"
              required
              type="text"
              placeholder="Enter event name"
              aria-invalid={Boolean(errors.eventName)}
              aria-describedby={errors.eventName ? 'eventName-error' : undefined}
              {...register('eventName')}
            />
            {errors.eventName && (
              <span id="eventName-error" className="text-xs text-red-700">
                {errors.eventName.message}
              </span>
            )}
          </FormField>

          <FormField label="Event Type" htmlFor="eventType" className="gap-2" required>
            <select
              className={inputClass}
              id="eventType"
              required
              aria-invalid={Boolean(errors.eventType)}
              aria-describedby={errors.eventType ? 'eventType-error' : undefined}
              {...register('eventType')}
            >
              <option value="">Select event type</option>
              <option value="0">Conference</option>
              <option value="1">Workshop</option>
              <option value="2">Webinar</option>
              <option value="3">Cultural Fest</option>
              <option value="4">Meeting</option>
              <option value="5">Product Launch</option>
            </select>
            {errors.eventType && (
              <span id="eventType-error" className="text-xs text-red-700">
                {errors.eventType.message}
              </span>
            )}
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <FormField label="Start Date and Time" htmlFor="startDateDate" className="gap-2" required>
            <div className="grid min-w-0 grid-cols-2 gap-2">
              <input
                className={inputClass}
                id="startDateDate"
                type="date"
                required
                aria-label="Start date"
                aria-invalid={Boolean(errors.startDate)}
                aria-describedby={errors.startDate ? 'startDate-error' : undefined}
                value={startDateTime.split('T')[0] ?? ''}
                onChange={(event) => updateDateTimePart('startDate', 'date', event.target.value)}
              />
              <input
                className={inputClass}
                id="startDateTime"
                type="time"
                required
                aria-label="Start time"
                aria-invalid={Boolean(errors.startDate)}
                aria-describedby={errors.startDate ? 'startDate-error' : undefined}
                value={startDateTime.split('T')[1] ?? ''}
                onChange={(event) => updateDateTimePart('startDate', 'time', event.target.value)}
              />
            </div>
            {errors.startDate && (
              <span id="startDate-error" className="text-xs text-red-700">
                {errors.startDate.message}
              </span>
            )}
          </FormField>
          <FormField label="Duration (hours)" htmlFor="durationPreset" className="gap-2" required>
            <select
              className={inputClass}
              id="durationPreset"
              required
              aria-label="Duration (hours)"
              value={isCustomDuration ? 'custom' : durationHours}
              aria-invalid={Boolean(durationError)}
              aria-describedby={durationError ? 'durationHours-error' : undefined}
              onChange={(event) => {
                if (event.target.value === 'custom') {
                  if (!isCustomDuration) {
                    setDurationHours('');
                    setDurationError('');
                  }
                  setCustomDurationMode(true);
                  return;
                }
                setCustomDurationMode(false);
                setDurationHours(event.target.value);
                setDurationError('');
                endManuallyEdited.current = false;
                updateEndFromDuration(getValues('startDate'), event.target.value);
              }}
            >
              {durationPresets.map((preset) => (
                <option key={preset.hours} value={preset.hours}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">Custom duration</option>
            </select>
            {isCustomDuration && (
              <input
                className={inputClass}
                id="durationHours"
                type="number"
                min="0.25"
                step="0.25"
                required
                inputMode="decimal"
                placeholder="Enter hours (e.g. 50)"
                value={durationHours}
                onChange={(event) => {
                  const nextDuration = event.target.value;
                  setDurationHours(nextDuration);
                  const parsedDuration = Number(nextDuration);
                  if (!Number.isFinite(parsedDuration) || parsedDuration < 0.25) {
                    setDurationError('Duration must be at least 0.25 hours.');
                    return;
                  }
                  setDurationError('');
                  endManuallyEdited.current = false;
                  updateEndFromDuration(getValues('startDate'), nextDuration);
                }}
                aria-label="Custom duration in hours"
                aria-invalid={Boolean(durationError)}
                aria-describedby={durationError ? 'durationHours-error' : undefined}
              />
            )}
            {durationError && (
              <span id="durationHours-error" className="text-xs text-red-700" role="alert">
                {durationError}
              </span>
            )}
          </FormField>
          <FormField label="End Date and Time" htmlFor="endDateDate" className="gap-2" required>
            <div className="grid min-w-0 grid-cols-2 gap-2">
              <input
                className={inputClass}
                id="endDateDate"
                type="date"
                required
                aria-label="End date"
                aria-invalid={Boolean(errors.endDate)}
                aria-describedby={errors.endDate ? 'endDate-error' : undefined}
                value={endDateTime.split('T')[0] ?? ''}
                onChange={(event) => updateDateTimePart('endDate', 'date', event.target.value)}
              />
              <input
                className={inputClass}
                id="endDateTime"
                type="time"
                required
                aria-label="End time"
                aria-invalid={Boolean(errors.endDate)}
                aria-describedby={errors.endDate ? 'endDate-error' : undefined}
                value={endDateTime.split('T')[1] ?? ''}
                onChange={(event) => updateDateTimePart('endDate', 'time', event.target.value)}
              />
            </div>
            {errors.endDate && (
              <span id="endDate-error" className="text-xs text-red-700">
                {errors.endDate.message}
              </span>
            )}
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Venue" htmlFor="venue" className="gap-2" required>
            <select
              className={inputClass}
              id="venue"
              required
              aria-invalid={Boolean(errors.venueId)}
              aria-describedby={errors.venueId ? 'venue-error' : undefined}
              {...register('venueId')}
            >
              <option value="">Select venue</option>
              {venues.map((venue) => (
                <option key={venue.venueId} value={venue.venueId}>
                  {venue.address} - Capacity: {venue.capacity}
                </option>
              ))}
            </select>
            {errors.venueId && (
              <span id="venue-error" className="text-xs text-red-700">
                {errors.venueId.message}
              </span>
            )}
          </FormField>
          <FormField label="Organization" htmlFor="organization" className="gap-2">
            <select className={inputClass} id="organization" {...register('orgId')}>
              <option value="">No organization</option>
              {organizations.map((organization) => (
                <option key={organization.orgId} value={organization.orgId}>
                  {organization.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Budget" htmlFor="budget" className="gap-2" required>
          <input
            className={inputClass}
            id="budget"
            required
            type="number"
            min="0"
            placeholder="Enter budget"
            aria-invalid={Boolean(errors.budget)}
            aria-describedby={errors.budget ? 'budget-error' : undefined}
            {...register('budget')}
          />
          {errors.budget && (
            <span id="budget-error" className="text-xs text-red-700">
              {errors.budget.message}
            </span>
          )}
        </FormField>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-5">
          {isEditing && onCancelEvent && (
            <button
              type="button"
              className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onCancelEvent}
              disabled={saving}
            >
              Cancel Event
            </button>
          )}
          <div className="ml-auto flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

export default EventEditorForm;
