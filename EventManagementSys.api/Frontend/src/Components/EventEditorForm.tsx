import type { FormEventHandler } from 'react'
import FormField from './FormField'

interface EventFormValues {
  eventName: string
  startDate: string
  endDate: string
  venueId: string
  budget: string
  eventType: string
  orgId: string
}

interface VenueOption {
  venueId: number
  address: string
  capacity: number
}

interface OrganizationOption {
  orgId: number
  name: string
}

interface EventEditorFormProps {
  formData: EventFormValues
  venues: VenueOption[]
  organizations: OrganizationOption[]
  isEditing: boolean
  saving: boolean
  onInputChange: (field: keyof EventFormValues, value: string) => void
  onSubmit: FormEventHandler<HTMLFormElement>
  onCancel: () => void
}

const inputClass =
  'w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10'

function EventEditorForm({
  formData,
  venues,
  organizations,
  isEditing,
  saving,
  onInputChange,
  onSubmit,
  onCancel,
}: EventEditorFormProps) {
  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-[#1e5b79]/35 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.17)]">
      <header className="border-b border-[#edf0f4] px-6 py-5">
        <h2 className="text-lg font-semibold text-[#111827]">
          {isEditing ? 'Edit Event' : 'Create Event'}
        </h2>
      </header>

      <form className="space-y-5 p-6" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Event Name" htmlFor="eventName" className="gap-2">
            <input
              className={inputClass}
              id="eventName"
              type="text"
              placeholder="Enter event name"
              value={formData.eventName}
              onChange={(event) => onInputChange('eventName', event.target.value)}
            />
          </FormField>

          <FormField label="Event Type" htmlFor="eventType" className="gap-2">
            <select
              className={inputClass}
              id="eventType"
              value={formData.eventType}
              onChange={(event) => onInputChange('eventType', event.target.value)}
            >
              <option value="">Select event type</option>
              <option value="0">Conference</option>
              <option value="1">Workshop</option>
              <option value="2">Webinar</option>
              <option value="3">Cultural Fest</option>
              <option value="4">Meeting</option>
              <option value="5">Product Launch</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Start Date" htmlFor="startDate" className="gap-2">
            <input
              className={inputClass}
              id="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={(event) => onInputChange('startDate', event.target.value)}
            />
          </FormField>
          <FormField label="End Date" htmlFor="endDate" className="gap-2">
            <input
              className={inputClass}
              id="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={(event) => onInputChange('endDate', event.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Venue" htmlFor="venue" className="gap-2">
            <select
              className={inputClass}
              id="venue"
              value={formData.venueId}
              onChange={(event) => onInputChange('venueId', event.target.value)}
            >
              <option value="">Select venue</option>
              {venues.map((venue) => (
                <option key={venue.venueId} value={venue.venueId}>
                  {venue.address} - Capacity: {venue.capacity}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Organization" htmlFor="organization" className="gap-2">
            <select
              className={inputClass}
              id="organization"
              value={formData.orgId}
              onChange={(event) => onInputChange('orgId', event.target.value)}
            >
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
            value={formData.budget}
            onChange={(event) => onInputChange('budget', event.target.value)}
          />
        </FormField>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button
            type="button"
            className="rounded-lg border border-[#dfe5ec] bg-white px-4 py-2 text-sm font-medium text-[#374151] transition hover:bg-[#f5f8fc]"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#0066ff] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0052cc] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default EventEditorForm
