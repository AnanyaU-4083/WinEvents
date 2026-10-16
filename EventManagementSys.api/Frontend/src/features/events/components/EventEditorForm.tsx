import { useEffect } from 'react';
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
  onSubmit: (values: EventFormData) => void;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-lg border border-border-default bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-placeholder focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10';

function EventEditorForm({
  formData,
  venues,
  organizations,
  isEditing,
  saving,
  onSubmit,
  onCancel,
}: EventEditorFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: formData,
  });

  useEffect(() => {
    reset(formData);
  }, [formData, reset]);

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-border-accent/35 bg-white shadow-card">
      <header className="border-b border-border-subtle px-6 py-5">
        <h2 className="text-lg font-semibold text-text-primary">
          {isEditing ? 'Edit Event' : 'Create Event'}
        </h2>
      </header>

      <form className="space-y-5 p-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Event Name" htmlFor="eventName" className="gap-2">
            <input
              className={inputClass}
              id="eventName"
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

          <FormField label="Event Type" htmlFor="eventType" className="gap-2">
            <select
              className={inputClass}
              id="eventType"
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

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Start Date" htmlFor="startDate" className="gap-2">
            <input
              className={inputClass}
              id="startDate"
              type="datetime-local"
              aria-invalid={Boolean(errors.startDate)}
              aria-describedby={errors.startDate ? 'startDate-error' : undefined}
              {...register('startDate')}
            />
            {errors.startDate && (
              <span id="startDate-error" className="text-xs text-red-700">
                {errors.startDate.message}
              </span>
            )}
          </FormField>
          <FormField label="End Date" htmlFor="endDate" className="gap-2">
            <input
              className={inputClass}
              id="endDate"
              type="datetime-local"
              aria-invalid={Boolean(errors.endDate)}
              aria-describedby={errors.endDate ? 'endDate-error' : undefined}
              {...register('endDate')}
            />
            {errors.endDate && (
              <span id="endDate-error" className="text-xs text-red-700">
                {errors.endDate.message}
              </span>
            )}
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Venue" htmlFor="venue" className="gap-2">
            <select
              className={inputClass}
              id="venue"
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

        <FormField label="Budget" htmlFor="budget" className="gap-2">
          <input
            className={inputClass}
            id="budget"
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

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button
            type="button"
            className="rounded-lg border border-border-default bg-white px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-subtle"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default EventEditorForm;
