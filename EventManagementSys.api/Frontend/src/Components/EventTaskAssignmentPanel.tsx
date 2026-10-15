import type { Dispatch, SetStateAction } from 'react'
import StatusBadge from './StatusBadge'

interface EmployeeOption {
  employeeId: number
  name: string
  jobTitle: string | null
}

interface StaffAssignment {
  assignmentId: number
  name: string
  jobTitle: string
  task: string
  deadline: string | null
  status: string
}

interface EventTaskAssignmentPanelProps {
  eventName: string
  employees: EmployeeOption[]
  assignedStaff: StaffAssignment[]
  selectedEmployeeId: string
  setSelectedEmployeeId: Dispatch<SetStateAction<string>>
  task: string
  setTask: Dispatch<SetStateAction<string>>
  deadline: string
  setDeadline: Dispatch<SetStateAction<string>>
  assigning: boolean
  onAssign: () => void
  onClose: () => void
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
    <section className="mb-6 overflow-hidden rounded-xl border border-[#1e5b79]/35 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.17)]">
      <header className="flex items-center justify-between border-b border-[#edf0f4] px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Assign Employee Task</h2>
          <p className="mt-1 text-sm text-[#6b7280]">Event: {eventName}</p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-[#dfe5ec] bg-white px-4 py-2 text-sm font-medium text-[#374151] transition hover:bg-[#f5f8fc]"
          onClick={onClose}
        >
          Close
        </button>
      </header>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#374151]" htmlFor="assignedEmployee">
              Employee
            </label>
            <select
              id="assignedEmployee"
              className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
              value={selectedEmployeeId}
              onChange={(event) => setSelectedEmployeeId(event.target.value)}
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.employeeId} value={employee.employeeId}>
                  {employee.name}{employee.jobTitle ? ` - ${employee.jobTitle}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#374151]" htmlFor="taskDeadline">
              Deadline
            </label>
            <input
              id="taskDeadline"
              type="datetime-local"
              className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#374151]" htmlFor="employeeTask">
            Task
          </label>
          <textarea
            id="employeeTask"
            rows={3}
            placeholder="Enter the task assigned to this employee"
            className="w-full resize-none rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10"
            value={task}
            onChange={(event) => setTask(event.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-[#0066ff] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0052cc] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={assigning}
            onClick={onAssign}
          >
            {assigning ? 'Assigning...' : 'Assign Task'}
          </button>
        </div>

        <div className="border-t border-[#edf0f4] pt-5">
          <h3 className="mb-4 text-base font-semibold text-[#111827]">Assigned Employees</h3>
          {assignedStaff.length === 0 ? (
            <p className="text-sm text-[#6b7280]">
              No employees have been assigned to this event yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#dfe5ec]">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#f5f8fc]">
                    {['Employee', 'Task', 'Deadline', 'Status'].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assignedStaff.map((assignment) => (
                    <tr key={assignment.assignmentId} className="border-t border-[#edf0f4]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#111827]">{assignment.name}</p>
                        <p className="text-xs text-[#6b7280]">{assignment.jobTitle}</p>
                      </td>
                      <td className="px-4 py-3 text-[#374151]">{assignment.task}</td>
                      <td className="px-4 py-3 text-[#374151]">
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
  )
}

export default EventTaskAssignmentPanel
