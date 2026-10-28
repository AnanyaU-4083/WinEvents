// Assign employees to event tasks.
import { useState, type Dispatch, type SetStateAction } from 'react';
import StatusBadge from '@/shared/components/StatusBadge';
import FormField from '@/shared/components/FormField';

interface EmployeeOption {
  employeeId: number;
  name: string;
  jobTitle: string | null;
}

interface StaffAssignment {
  assignmentId: number;
  employeeId?: number;
  name: string;
  jobTitle: string;
  task: string;
  deadline: string | null;
  status: string | number;
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
  onReassign?: (assignment: StaffAssignment, employeeId: number) => void | Promise<void>;
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
  onReassign,
}: EventTaskAssignmentPanelProps) {
  const [reassignmentEmployeeIds, setReassignmentEmployeeIds] = useState<Record<number, string>>(
    {},
  );
  const [deadlineDate = '', deadlineTime = ''] = deadline.split('T');
  const setDeadlineDay = (dayOffset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    const dateValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setDeadline(`${dateValue}T${deadlineTime || '17:00'}`);
  };
  const setDeadlineDatePart = (value: string) => {
    if (!value) {
      setDeadline('');
      return;
    }
    setDeadline(`${value}T${deadlineTime || '17:00'}`);
  };
  const setDeadlineTimePart = (value: string) => {
    if (!value) {
      setDeadline(deadlineDate ? `${deadlineDate}T17:00` : '');
      return;
    }
    const today = new Date();
    const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setDeadline(`${deadlineDate || todayValue}T${value}`);
  };
  const getStatusLabel = (status: string | number) =>
    ({ '0': 'Pending', '1': 'In Progress', '2': 'Completed', '3': 'Declined' })[String(status)] ??
    String(status);
  const isDeclined = (status: string | number) =>
    getStatusLabel(status).toLowerCase() === 'declined';
  const isAlreadyReassigned = (assignment: StaffAssignment) =>
    assignedStaff.some((other) => {
      const sameTask = other.task.trim().toLowerCase() === assignment.task.trim().toLowerCase();
      const sameDeadline =
        (other.deadline ? new Date(other.deadline).getTime() : null) ===
        (assignment.deadline ? new Date(assignment.deadline).getTime() : null);
      return (
        other.assignmentId !== assignment.assignmentId &&
        other.employeeId !== assignment.employeeId &&
        !isDeclined(other.status) &&
        sameTask &&
        sameDeadline
      );
    });
  const handleReassign = async (assignment: StaffAssignment) => {
    const employeeId = Number(reassignmentEmployeeIds[assignment.assignmentId]);
    if (!employeeId || !onReassign) return;
    await onReassign(assignment, employeeId);
    setReassignmentEmployeeIds((current) => ({ ...current, [assignment.assignmentId]: '' }));
  };
  return (
    <section className="mb-3 overflow-hidden rounded-2xl border border-white/35 bg-transparent shadow-none">
      <header className="border-b border-border-subtle px-4 py-5 pr-14 sm:px-7 sm:py-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-text-primary">
            Assign Employee Task
          </h2>
          <p className="mt-1 text-sm text-text-muted">Event: {eventName}</p>
        </div>
      </header>

      <div className="space-y-5 p-4 sm:p-7">
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
            <label className="text-sm font-medium text-text-secondary" htmlFor="taskDeadlineDate">
              Deadline
            </label>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 max-[420px]:grid-cols-1">
              <input
                id="taskDeadlineDate"
                type="date"
                aria-label="Deadline date"
                className="min-w-0 rounded-lg border border-border-default bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                value={deadlineDate}
                onChange={(event) => setDeadlineDatePart(event.target.value)}
              />
              <input
                id="taskDeadlineTime"
                type="time"
                aria-label="Deadline time"
                className="w-[8.5rem] rounded-lg border border-border-default bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 max-[420px]:w-full"
                value={deadlineTime}
                onChange={(event) => setDeadlineTimePart(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Quick deadline options">
              {[
                ['Today', 0],
                ['Tomorrow', 1],
                ['Next week', 7],
              ].map(([label, offset]) => (
                <button
                  key={label}
                  type="button"
                  className="rounded-full border border-border-default bg-white/70 px-3 py-1.5 text-xs font-medium text-white transition hover:border-brand-primary/50 hover:bg-brand-primary/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  onClick={() => setDeadlineDay(Number(offset))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <FormField label="Task" htmlFor="employeeTask" required>
          <textarea
            id="employeeTask"
            rows={3}
            placeholder="e.g. Confirm catering requirements with the venue"
            className="w-full resize-y rounded-lg border border-border-default bg-white/90 px-3 py-3 text-sm leading-6 text-text-primary outline-none transition placeholder:text-text-placeholder focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            value={task}
            onChange={(event) => setTask(event.target.value)}
          />
        </FormField>

        <div className="pt-1">
          <h3 className="mb-1 text-base font-semibold text-text-primary">Assigned Employees</h3>
          <p className="mb-4 text-xs text-text-muted">Current task assignments and their status.</p>
          {assignedStaff.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-default bg-white/45 px-4 py-6 text-center text-sm text-text-muted">
              <span className="mb-1 block font-medium text-text-secondary">
                No employees assigned yet
              </span>
              No employees have been assigned to this event yet.
            </div>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {assignedStaff.map((assignment) => (
                <article
                  key={assignment.assignmentId}
                  className="grid gap-3 rounded-xl border border-border-subtle bg-white/60 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-semibold text-text-primary">{assignment.name}</p>
                      {assignment.jobTitle && (
                        <p className="text-xs text-text-muted">{assignment.jobTitle}</p>
                      )}
                    </div>
                    <p className="mt-1 break-words text-sm text-text-secondary">
                      {assignment.task}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {assignment.deadline
                        ? `Due ${new Date(assignment.deadline).toLocaleString()}`
                        : 'No deadline'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <StatusBadge context="task" status={getStatusLabel(assignment.status)} />
                    {isDeclined(assignment.status) && !isAlreadyReassigned(assignment) && (
                      <div className="flex min-w-0 items-center gap-2">
                        <select
                          aria-label={`Select employee to reassign ${assignment.task}`}
                          className="min-w-0 flex-1 rounded-lg border border-border-default bg-white px-2 py-1.5 text-xs text-text-primary"
                          value={reassignmentEmployeeIds[assignment.assignmentId] ?? ''}
                          onChange={(event) =>
                            setReassignmentEmployeeIds((current) => ({
                              ...current,
                              [assignment.assignmentId]: event.target.value,
                            }))
                          }
                        >
                          <option value="">Select employee</option>
                          {employees
                            .filter((employee) => employee.employeeId !== assignment.employeeId)
                            .map((employee) => (
                              <option key={employee.employeeId} value={employee.employeeId}>
                                {employee.name}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          className="rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={
                            assigning ||
                            !reassignmentEmployeeIds[assignment.assignmentId] ||
                            !onReassign
                          }
                          onClick={() => void handleReassign(assignment)}
                        >
                          Assign
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <footer className="flex justify-end border-t border-border-subtle pt-5">
          <button
            type="button"
            className="rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={assigning}
            aria-busy={assigning}
            onClick={onAssign}
          >
            {assigning ? 'Assigning...' : 'Assign Task'}
          </button>
        </footer>
      </div>
    </section>
  );
}

export default EventTaskAssignmentPanel;
