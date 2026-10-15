import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EventEditorForm from '../src/Components/EventEditorForm'
import EventListPanel from '../src/Components/EventListPanel'
import EventTaskAssignmentPanel from '../src/Components/EventTaskAssignmentPanel'

const editorForm = {
  eventName: 'Town Hall',
  startDate: '2026-10-20T17:30',
  endDate: '2026-10-20T18:30',
  venueId: '1',
  budget: '100',
  eventType: '0',
  orgId: '2',
}
const event = {
  eventId: 11,
  eventName: 'Town Hall',
  startDate: '2026-10-20T17:30:00',
  endDate: '2026-10-20T18:30:00',
  budget: 100,
  eventType: 0 as const,
  status: 0 as const,
  venueId: 1,
  orgId: 2,
}

describe('event editor form', () => {
  it('renders existing options and forwards field edits and submit', () => {
    const onInputChange = vi.fn()
    const onSubmit = vi.fn((e) => e.preventDefault())
    const onCancel = vi.fn()
    render(
      <EventEditorForm
        formData={editorForm}
        venues={[{ venueId: 1, address: 'Main Hall', capacity: 250 }]}
        organizations={[{ orgId: 2, name: 'WinWire' }]}
        isEditing
        saving={false}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Edit Event' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Main Hall - Capacity: 250' })).toHaveValue('1')
    expect(screen.getByRole('option', { name: 'WinWire' })).toHaveValue('2')
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'Staff meeting' } })
    fireEvent.change(screen.getByLabelText('Event Type'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2026-10-21T09:00' } })
    fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2026-10-21T10:00' } })
    fireEvent.change(screen.getByLabelText('Venue'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Organization'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Budget'), { target: { value: '200' } })
    expect(onInputChange).toHaveBeenCalledTimes(7)
    fireEvent.submit(screen.getByRole('heading', { name: 'Edit Event' }).closest('section')!.querySelector('form')!)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('uses create labels and disables save while saving', () => {
    render(
      <EventEditorForm
        formData={{ ...editorForm, eventName: '' }}
        venues={[]}
        organizations={[]}
        isEditing={false}
        saving
        onInputChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Create Event' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Select venue' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'No organization' })).toBeInTheDocument()
  })
})

describe('event task assignment panel', () => {
  it('shows assignment controls, empty state, and forwards interactions', () => {
    const setSelectedEmployeeId = vi.fn()
    const setTask = vi.fn()
    const setDeadline = vi.fn()
    const onAssign = vi.fn()
    const onClose = vi.fn()
    render(
      <EventTaskAssignmentPanel
        eventName="Town Hall"
        employees={[{ employeeId: 4, name: 'Alex', jobTitle: 'Coordinator' }, { employeeId: 5, name: 'Robin', jobTitle: null }]}
        assignedStaff={[]}
        selectedEmployeeId=""
        setSelectedEmployeeId={setSelectedEmployeeId}
        task=""
        setTask={setTask}
        deadline=""
        setDeadline={setDeadline}
        assigning={false}
        onAssign={onAssign}
        onClose={onClose}
      />,
    )
    expect(screen.getByText('Event: Town Hall')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Alex - Coordinator' })).toHaveValue('4')
    expect(screen.getByRole('option', { name: 'Robin' })).toHaveValue('5')
    expect(screen.getByText('No employees have been assigned to this event yet.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Employee'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Deadline'), { target: { value: '2026-10-21T09:00' } })
    fireEvent.change(screen.getByLabelText('Task'), { target: { value: 'Prepare the room' } })
    fireEvent.click(screen.getByRole('button', { name: 'Assign Task' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(setSelectedEmployeeId).toHaveBeenCalledWith('4')
    expect(setDeadline).toHaveBeenCalledWith('2026-10-21T09:00')
    expect(setTask).toHaveBeenCalledWith('Prepare the room')
    expect(onAssign).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows assigned rows, deadline fallback, status badge, and busy state', () => {
    render(
      <EventTaskAssignmentPanel
        eventName="Town Hall"
        employees={[]}
        assignedStaff={[
          { assignmentId: 1, name: 'Alex', jobTitle: 'Coordinator', task: 'Prepare room', deadline: null, status: 'Pending' },
        ]}
        selectedEmployeeId=""
        setSelectedEmployeeId={vi.fn()}
        task=""
        setTask={vi.fn()}
        deadline=""
        setDeadline={vi.fn()}
        assigning
        onAssign={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('Assigned Employees')).toBeInTheDocument()
    expect(screen.getByText('Alex')).toBeInTheDocument()
    expect(screen.getByText('Prepare room')).toBeInTheDocument()
    expect(screen.getByText('No deadline')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toHaveClass('text-yellow-700')
    expect(screen.getByRole('button', { name: 'Assigning...' })).toBeDisabled()
  })
})

describe('event list panel', () => {
  const callbacks = () => ({
    onSearchChange: vi.fn(), onStatusFilterChange: vi.fn(), isRegistered: vi.fn(() => false),
    isRegistrationCancelled: vi.fn(() => false), cancellingRegistrationEventId: null,
    getEventTypeText: vi.fn(() => 'Conference'), formatDate: vi.fn(() => 'Oct 20, 2026'),
    onAssign: vi.fn(), onEdit: vi.fn(), onCancel: vi.fn(), onRegister: vi.fn(), onCancelRegistration: vi.fn(),
  })

  it('shows loading and empty-state copy for roles and filters', () => {
    const cb = callbacks()
    const props = { events: [], searchValue: '', statusFilter: 'scheduled', canManageEvents: true, isAttendee: false, registeringEventId: null, ...cb }
    const { rerender } = render(<EventListPanel {...props} loading />)
    expect(screen.getByText('Loading events...')).toBeInTheDocument()
    rerender(<EventListPanel {...props} loading={false} />)
    expect(screen.getByText('There are no scheduled events.')).toBeInTheDocument()
    rerender(<EventListPanel {...props} loading={false} statusFilter="completed" />)
    expect(screen.getByText('There are no past events.')).toBeInTheDocument()
    rerender(<EventListPanel {...props} loading={false} statusFilter="cancelled" />)
    expect(screen.getByText('There are no cancelled events.')).toBeInTheDocument()
    rerender(<EventListPanel {...props} loading={false} statusFilter="all" />)
    expect(screen.getByText('Create your first event to see it here.')).toBeInTheDocument()
    rerender(<EventListPanel {...props} loading={false} canManageEvents={false} statusFilter="all" />)
    expect(screen.getByText('There are no events matching your search.')).toBeInTheDocument()
  })

  it('forwards searches and filters for attendees and handles registration states', () => {
    const cb = callbacks()
    const { rerender } = render(
      <EventListPanel
        events={[event]}
        loading={false}
        searchValue="Town"
        statusFilter="all"
        canManageEvents={false}
        isAttendee
        registeringEventId={null}
        {...cb}
      />,
    )
    fireEvent.change(screen.getByPlaceholderText('Search events...'), { target: { value: 'Hall' } })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'completed' } })
    expect(cb.onSearchChange).toHaveBeenCalledWith('Hall')
    expect(cb.onStatusFilterChange).toHaveBeenCalledWith('completed')
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    expect(cb.onRegister).toHaveBeenCalledWith(11)
    rerender(
      <EventListPanel events={[event]} loading={false} searchValue="" statusFilter="all" canManageEvents={false} isAttendee registeringEventId={11} {...cb} />,
    )
    expect(screen.getByRole('button', { name: 'Registering...' })).toBeDisabled()
    rerender(
      <EventListPanel events={[event]} loading={false} searchValue="" statusFilter="all" canManageEvents={false} isAttendee registeringEventId={null} {...{ ...cb, isRegistered: () => true }} />,
    )
    expect(screen.getByText('Registered')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Registration' }))
    expect(cb.onCancelRegistration).toHaveBeenCalledWith(11)
    rerender(
      <EventListPanel events={[event]} loading={false} searchValue="" statusFilter="all" canManageEvents={false} isAttendee registeringEventId={11} {...{ ...cb, isRegistered: () => true, cancellingRegistrationEventId: 11 }} />,
    )
    expect(screen.getByRole('button', { name: 'Cancelling...' })).toBeDisabled()
    rerender(
      <EventListPanel events={[event]} loading={false} searchValue="" statusFilter="all" canManageEvents={false} isAttendee registeringEventId={null} {...{ ...cb, isRegistrationCancelled: () => true }} />,
    )
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Re-register' }))
    expect(cb.onRegister).toHaveBeenCalledWith(11)
    rerender(
      <EventListPanel events={[event]} loading={false} searchValue="" statusFilter="all" canManageEvents={false} isAttendee registeringEventId={11} {...{ ...cb, isRegistrationCancelled: () => true }} />,
    )
    expect(screen.getByRole('button', { name: 'Registering...' })).toBeDisabled()
    rerender(
      <EventListPanel events={[{ ...event, status: 1 }]} loading={false} searchValue="" statusFilter="all" canManageEvents={false} isAttendee registeringEventId={null} {...cb} />,
    )
    expect(screen.getByText('Not available')).toBeInTheDocument()
  })

  it('shows manager actions for active events and terminal labels without actions', () => {
    const cb = callbacks()
    const { rerender } = render(
      <EventListPanel events={[event]} loading={false} searchValue="" statusFilter="all" canManageEvents isAttendee={false} registeringEventId={null} {...cb} />,
    )
    expect(screen.getByText('View and manage your events.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Assign Task' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(cb.onAssign).toHaveBeenCalledWith(event)
    expect(cb.onEdit).toHaveBeenCalledWith(11)
    expect(cb.onCancel).toHaveBeenCalledWith(11)

    rerender(<EventListPanel events={[{ ...event, status: 1 }]} loading={false} searchValue="" statusFilter="all" canManageEvents isAttendee={false} registeringEventId={null} {...cb} />)
    expect(screen.getAllByText('Cancelled')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    rerender(<EventListPanel events={[{ ...event, status: 2 }]} loading={false} searchValue="" statusFilter="all" canManageEvents isAttendee={false} registeringEventId={null} {...cb} />)
    expect(screen.getAllByText('Completed')).toHaveLength(2)
  })
})
