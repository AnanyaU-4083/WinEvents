import { useEffect, useState } from 'react'
import { useMsal } from '@azure/msal-react'

interface EmployeeTask {
  eventId: number
  eventName: string
  employeeId: number
  name: string
  jobTitle: string
  task: string
  deadline: string | null
  status: string
}

function EmployeeTasks() {
  const { instance, accounts } = useMsal()

  const [tasks, setTasks] = useState<EmployeeTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const account =
    instance.getActiveAccount() ?? accounts[0]

  const accountId = account?.homeAccountId

  useEffect(() => {
    const loadTasks = async () => {
      if (!account) {
        return
      }

      try {
        setLoading(true)
        setError('')

        const tokenResponse =
          await instance.acquireTokenSilent({
            scopes: [
              'api://0332cc25-1dc3-4542-b1cd-a1ad23d0f620/access_as_user',
            ],
            account,
          })

        const response = await fetch(
          `/api/employees/my-tasks`,
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.accessToken}`,
            },
          },
        )

        if (!response.ok) {
          throw new Error(
            `Failed to load tasks. Status: ${response.status}`,
          )
        }

        const data: EmployeeTask[] =
          await response.json()

        setTasks(data)
      } catch (error) {
        console.error(
          'Failed to load employee tasks:',
          error,
        )

        setError(
          'Unable to load your assigned tasks.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [accountId, instance])

  const markAsCompleted = async (
    eventId: number,
    employeeId: number,
  ) => {
    if (!account) {
      return
    }

    try {
      setError('')

      const tokenResponse =
        await instance.acquireTokenSilent({
          scopes: [
            'api://0332cc25-1dc3-4542-b1cd-a1ad23d0f620/access_as_user',
          ],
          account,
        })

      const task = tasks.find(
        (item) =>
          item.eventId === eventId &&
          item.employeeId === employeeId,
      )

      if (!task) {
        return
      }

      const response = await fetch(
        `/api/events/${eventId}/staff/${employeeId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenResponse.accessToken}`,
          },
          body: JSON.stringify({
            task: task.task,
            deadline: task.deadline,
            status: 2,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(
          `Failed to complete task. Status: ${response.status}`,
        )
      }

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.eventId === eventId &&
          item.employeeId === employeeId
            ? {
                ...item,
                status: 'Completed',
              }
            : item,
        ),
      )
    } catch (error) {
      console.error(
        'Failed to mark task as completed:',
        error,
      )

      setError(
        'Unable to mark the task as completed.',
      )
    }
  }

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700'

      case 'inprogress':
      case 'in progress':
        return 'bg-blue-100 text-blue-700'

      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-700'
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f8fc] px-6 py-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#111827]">
            My Tasks
          </h1>

          <p className="mt-1 text-sm text-[#6b7280]">
            View the tasks assigned to you for upcoming events.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border border-[#dfe5ec] bg-white p-8 text-center">
            <p className="text-sm text-[#6b7280]">
              Loading your tasks...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          tasks.length === 0 && (
            <div className="rounded-xl border border-[#dfe5ec] bg-white p-10 text-center">
              <h2 className="text-lg font-semibold text-[#111827]">
                No tasks assigned
              </h2>

              <p className="mt-2 text-sm text-[#6b7280]">
                You currently don't have any tasks assigned
                to you.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          tasks.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-[#dfe5ec] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full">

                  <thead className="border-b border-[#dfe5ec] bg-[#f8fafc]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                        Event
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                        Task
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                        Deadline
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                        Status
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#eef2f7]">
                    {tasks.map((item) => (
                      <tr
                        key={`${item.eventId}-${item.employeeId}`}
                        className="transition hover:bg-[#f8fafc]"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-[#111827]">
                            {item.eventName}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-[#374151]">
                            {item.task}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          {item.deadline ? (
                            <p className="text-sm text-[#374151]">
                              {new Date(
                                item.deadline,
                              ).toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-sm text-[#9ca3af]">
                              No deadline
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {item.status.toLowerCase() ===
                          'completed' ? (
                            <span className="text-sm font-medium text-green-600">
                              Completed
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                markAsCompleted(
                                  item.eventId,
                                  item.employeeId,
                                )
                              }
                              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                            >
                              Mark as Completed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}

export default EmployeeTasks