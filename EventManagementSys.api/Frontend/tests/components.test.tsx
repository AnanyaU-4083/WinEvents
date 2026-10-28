import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import AttendeeEventPopup from '../src/features/dashboard/components/AttendeeEventPopup';
import DashboardSummaryCards from '../src/features/dashboard/components/DashboardSummaryCards';
import EmptyTableRow from '../src/shared/components/EmptyTableRow';
import EventFilter from '../src/shared/components/EventFilter';
import EventStatusFilter from '../src/features/events/components/EventStatusFilter';
import FormField from '../src/shared/components/FormField';
import Modal from '../src/shared/components/Modal';
import PageHeader from '../src/shared/components/PageHeader';
import SearchBar from '../src/shared/components/SearchBar';
import StatusBadge from '../src/shared/components/StatusBadge';
import UpcomingEventsPanel from '../src/features/dashboard/components/UpcomingEventsPanel';

describe('shared form and layout components', () => {
  it('renders a labeled field and supports optional label attributes', () => {
    const { rerender } = render(
      <FormField label="Event name" htmlFor="event-name" className="gap-3" required>
        <input id="event-name" />
      </FormField>,
    );
    expect(screen.getByLabelText(/Event name/)).toBeInTheDocument();
    expect(screen.getByText('*')).toHaveClass('text-red-600');
    expect(screen.getByLabelText(/Event name/).parentElement).toHaveClass('gap-3');

    rerender(
      <FormField label="No id">
        <input />
      </FormField>,
    );
    expect(screen.getByText('No id')).toBeInTheDocument();
  });

  it('only renders an open modal and exposes dialog accessibility attributes', () => {
    const { rerender } = render(
      <Modal open={false} ariaLabel="Edit event">
        <p>Hidden contents</p>
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <Modal open ariaLabel="Edit event" className="custom">
        <p>Visible contents</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Edit event' })).toHaveAttribute(
      'aria-modal',
      'true',
    );
    expect(screen.getByRole('dialog')).toHaveClass('custom');
    expect(screen.getByText('Visible contents')).toBeInTheDocument();
  });

  it('renders each page header layout, optional action, and description content', () => {
    const { rerender } = render(<PageHeader title="Events" description="Manage events" />);
    expect(screen.getByRole('heading', { name: 'Events' })).toBeInTheDocument();
    expect(screen.getByText('Manage events').closest('header')).toHaveClass('justify-between');

    rerender(
      <PageHeader
        title="People"
        description={<span>Current people</span>}
        layout="responsive"
        action={<button>Invite</button>}
      />,
    );
    expect(screen.getByText('Current people')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invite' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveClass('md:flex-row');

    rerender(<PageHeader title="Reports" description="Usage" layout="left" />);
    expect(screen.getByRole('banner')).toHaveClass('flex-col');
  });

  it('renders an empty table row with the requested column span', () => {
    render(
      <table>
        <tbody>
          <EmptyTableRow colSpan={4} title="Nothing here" description="Try again later." />
        </tbody>
      </table>,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Try again later.').closest('td')).toHaveAttribute('colspan', '4');
  });
});

describe('search and filter controls', () => {
  it('forwards search input updates and supports the default placeholder', () => {
    const onChange = vi.fn();
    const { rerender } = render(<SearchBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'garba' } });
    expect(onChange).toHaveBeenCalledWith('garba');

    rerender(<SearchBar value="garba" onChange={onChange} placeholder="Find attendees" />);
    expect(screen.getByPlaceholderText('Find attendees')).toHaveValue('garba');
  });

  it('forwards selected event and event-status filters', () => {
    const onEventChange = vi.fn();
    const onStatusChange = vi.fn();
    render(
      <>
        <EventFilter
          value="all"
          events={[{ eventId: 7, eventName: 'Conference' }]}
          onChange={onEventChange}
        />
        <EventStatusFilter value="scheduled" onChange={onStatusChange} />
      </>,
    );
    fireEvent.change(screen.getAllByRole('combobox')[0]!, { target: { value: '7' } });
    expect(onEventChange).toHaveBeenCalledWith('7');
    fireEvent.change(screen.getAllByRole('combobox')[1]!, { target: { value: 'past' } });
    expect(onStatusChange).toHaveBeenCalledWith('past');
    expect(screen.getByRole('option', { name: 'Conference' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cancelled' })).toBeInTheDocument();
  });
});

describe('status badges', () => {
  it('has no automated accessibility violations', async () => {
    const { container } = render(<StatusBadge status="Scheduled" />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it.each([
    ['Scheduled', 'event', 'text-blue-700'],
    ['Cancelled', 'event', 'text-red-700'],
    ['Canceled', 'event', 'text-red-700'],
    ['Other', 'event', 'text-gray-700'],
    ['Completed', 'task', 'text-green-700'],
    ['InProgress', 'task', 'text-blue-700'],
    ['In progress', 'task', 'text-blue-700'],
    ['Pending', 'task', 'text-yellow-700'],
    ['Overdue', 'task', 'text-red-700'],
    ['Other', 'task', 'text-gray-700'],
  ] as const)('styles %s in %s context', (status, context, expectedClass) => {
    render(<StatusBadge status={status} context={context} />);
    expect(screen.getByText(status)).toHaveClass(expectedClass);
  });

  it('defaults to event status styling and handles whitespace/case', () => {
    render(<StatusBadge status=" scheduled " />);
    expect(screen.getByText((_, element) => element?.tagName === 'SPAN')).toHaveClass(
      'text-blue-700',
    );
  });
});

describe('dashboard display components', () => {
  it('shows all summary values', () => {
    render(<DashboardSummaryCards total={5} scheduled={3} completed={1} upcoming={2} />);
    expect(screen.getByText('Total Events').parentElement).toHaveTextContent('5');
    expect(screen.getByText('Scheduled').parentElement).toHaveTextContent('3');
    expect(screen.getByText('Completed').parentElement).toHaveTextContent('1');
    expect(screen.getByText('Upcoming').parentElement).toHaveTextContent('2');
  });

  it('shows loading and empty upcoming-event states', () => {
    const props = {
      events: [],
      formatDate: (date: string) => date,
      formatTime: (date: string) => date,
    };
    const { rerender } = render(<UpcomingEventsPanel {...props} loading />);
    expect(screen.getByText('Loading events...')).toBeInTheDocument();
    rerender(<UpcomingEventsPanel {...props} loading={false} />);
    expect(screen.getByText('No upcoming events.')).toBeInTheDocument();
  });

  it('formats event summaries and the calendar date badge', () => {
    const onSelectEvent = vi.fn();
    render(
      <UpcomingEventsPanel
        events={[{ eventId: 2, eventName: 'Garba Celebration', startDate: '2026-10-20T17:30:00' }]}
        loading={false}
        formatDate={() => 'Oct 20, 2026'}
        formatTime={() => '5:30 PM'}
        onSelectEvent={onSelectEvent}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Garba Celebration' })).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Oct')).toBeInTheDocument();
    expect(screen.getByLabelText('Oct 20, 2026')).toBeInTheDocument();
    expect(screen.getByText(/5:30 PM/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View details for Garba Celebration' }));
    expect(onSelectEvent).toHaveBeenCalledWith(2);
  });

  it('shows attendee event details and forwards close action', () => {
    const onClose = vi.fn();
    render(
      <AttendeeEventPopup
        event={{ eventName: 'Town Hall', startDate: 'start', endDate: 'end' }}
        top={40}
        left={60}
        location="Main Hall"
        formatDate={() => 'Oct 20, 2026'}
        formatTime={(date) => (date === 'start' ? '5:30 PM' : '6:30 PM')}
        onClose={onClose}
        onReregister={() => {}}
        reregistering={false}
      />,
    );
    expect(screen.getByRole('dialog', { name: 'Town Hall' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Oct 20, 2026')).toBeInTheDocument();
    expect(screen.getByText('5:30 PM')).toBeInTheDocument();
    expect(screen.getByText('6:30 PM')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Main Hall')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close event details' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

