import type { Dispatch, SetStateAction } from 'react';
import StatusBadge from '@/shared/components/StatusBadge';
import FormField from '@/shared/components/FormField';

interface EmployeeOption {
  employeeId: number;
  name: string;
  jobTitle: string | null;
}

interface StaffAssignment {
  assignmentId: number;
  name: string;
  jobTitle: string;
  task: string;
  deadline: string | null;
  status: string;
}

interface EventTaskAssignmentPanelProps {
  eventName: string;
  employees: EmployeeOption[];
  assignedStaff: StaffAssignment[];
  selectedEmployeeId: string;
  setSelectedEmployeeId: Dispatch<SetStateAction<string>>;
  task: string;
  setTask: Dispatch<SetStateAction<string>>;
  deadline: string;
  setDeadline: Dispatch<SetStateAction<string>>;
  assigning: boolean;
  onAssign: () => void;
  onClose: () => void;
}

function EventTaskAssignmentPanel({
  eventName,
  employees,
  assignedStaff,
  selectedEmployeeId,
  setSelectedEmployeeId,
  task,
  setTask,
  deadline,
  setDeadline,
  assigning,
  onAssign,
  onClose,
}: EventTaskAssignmentPanelProps) {
  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-border-accent/35 bg-white/60 shadow-card backdrop-blur-md">
      <header className="flex items-center justify-between border-b border-border-subtle px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Assign Employee Task</h2>
          <p className="mt-1 text-sm text-text-muted">Event: {eventName}</p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-border-default bg-white px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-subtle"
          onClick={onClose}
        >
          Close
        </button>
      </header>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Employee" htmlFor="assignedEmployee" required>
            <select
              id="assignedEmployee"
              className="w-full rounded-lg border border-border-default bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              value={selectedEmployeeId}
              onChange={(event) => setSelectedEmployeeId(event.target.value)}
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.employeeId} value={employee.employeeId}>
                  {employee.name}
                  {employee.jobTitle ? ` - ${employee.jobTitle}` : ''}
                </option>
              ))}
            </select>
          </FormField>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary" htmlFor="taskDeadline">
              Deadline
            </label>
            <input
              id="taskDeadline"
              type="datetime-local"
              className="w-full rounded-lg border border-border-default bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </div>
        </div>

        <FormField label="Task" htmlFor="employeeTask" required>
          <textarea
            id="employeeTask"
            rows={3}
            placeholder="Enter the task assigned to this employee"
            className="w-full resize-none rounded-lg border border-border-default bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-placeholder focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            value={task}
            onChange={(event) => setTask(event.target.value)}
          />
        </FormField>

        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            disabled={assigning}
            onClick={onAssign}
          >
            {assigning ? 'Assigning...' : 'Assign Task'}
          </button>
        </div>

        <div className="border-t border-border-subtle pt-5">
          <h3 className="mb-4 text-base font-semibold text-text-primary">Assigned Employees</h3>
          {assignedStaff.length === 0 ? (
            <p className="text-sm text-text-muted">
              No employees have been assigned to this event yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border-default">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="bg-surface-subtle">
                    {['Employee', 'Task', 'Deadline', 'Status'].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assignedStaff.map((assignment) => (
                    <tr key={assignment.assignmentId} className="border-t border-border-subtle">
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-primary">{assignment.name}</p>
                        <p className="text-xs text-text-muted">{assignment.jobTitle}</p>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{assignment.task}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {assignment.deadline
                          ? new Date(assignment.deadline).toLocaleString()
                          : 'No deadline'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge context="task" status={assignment.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default EventTaskAssignmentPanel;
