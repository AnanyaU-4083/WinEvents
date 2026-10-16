import { apiRequest } from '../../../shared/api/apiClient';
import { useEffect, useRef, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import PageHeader from '@/shared/components/PageHeader';
import StatusBadge from '@/shared/components/StatusBadge';

interface EmployeeTask {
  assignmentId: number;
  eventId: number;
  eventName: string;
  employeeId: number;
  name: string;
  jobTitle: string;
  task: string;
  deadline: string | null;
  status: string;
}

function MyTasksPage() {
  const { instance, accounts } = useMsal();

  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(0);

  const account = instance.getActiveAccount() ?? accounts[0];
  const accountRef = useRef(account);
  const accountId = account?.homeAccountId;
  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  useEffect(() => {
    setCurrentTime(Date.now());
    const timerId = window.setInterval(() => setCurrentTime(Date.now()), 15_000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    const loadTasks = async () => {
      const activeAccount = accountRef.current;
      if (!activeAccount) {
        return;
      }

      try {
        setLoading(true);
        setError('');

        const tokenResponse = await instance.acquireTokenSilent({
          scopes: ['api://0332cc25-1dc3-4542-b1cd-a1ad23d0f620/access_as_user'],
          account: activeAccount,
        });

        const response = await apiRequest(`/api/employees/my-tasks`, {
          headers: {
            Authorization: `Bearer ${tokenResponse.accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load tasks. Status: ${response.status}`);
        }

        const data: EmployeeTask[] = await response.json();

        setTasks(data);
      } catch (error) {
        console.error('Failed to load employee tasks:', error);

        setError('Unable to load your assigned tasks.');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [accountId, instance]);

  const markAsCompleted = async (assignmentId: number) => {
    if (!account) {
      return;
    }

    try {
      setError('');

      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ['api://0332cc25-1dc3-4542-b1cd-a1ad23d0f620/access_as_user'],
        account,
      });

      const task = tasks.find((item) => item.assignmentId === assignmentId);

      if (!task) {
        return;
      }

      const response = await apiRequest(`/api/staff/${assignmentId}`, {
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
      });

      if (!response.ok) {
        throw new Error(`Failed to complete task. Status: ${response.status}`);
      }

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.assignmentId === assignmentId
            ? {
                ...item,
                status: 'Completed',
              }
            : item,
        ),
      );
    } catch (error) {
      console.error('Failed to mark task as completed:', error);

      setError('Unable to mark the task as completed.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-subtle px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title="My Tasks"
          description="View the tasks assigned to you for upcoming events."
          layout="left"
        />

        {loading && (
          <div className="rounded-xl border border-border-accent/35 bg-white p-8 text-center shadow-lg shadow-slate-900/15">
            <p className="text-sm text-text-muted">Loading your tasks...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <div className="rounded-xl border border-border-accent/35 bg-white p-10 text-center shadow-lg shadow-slate-900/15">
            <h2 className="text-lg font-semibold text-text-primary">No tasks assigned</h2>

            <p className="mt-2 text-sm text-text-muted">
              You currently don't have any tasks assigned to you.
            </p>
          </div>
        )}

        {!loading && !error && tasks.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border-accent/35 bg-white shadow-lg shadow-slate-900/15">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-border-default bg-surface-muted">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Event
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Task
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Deadline
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-surface-neutral">
                  {tasks.map((item) => {
                    const deadlineTime = item.deadline
                      ? new Date(item.deadline).getTime()
                      : Number.NaN;
                    const overdueDuration = currentTime - deadlineTime;
                    const isOverdue =
                      item.status.toLowerCase() !== 'completed' &&
                      Number.isFinite(deadlineTime) &&
                      overdueDuration > 0;
                    const overdueLevel = isOverdue
                      ? Math.min(3, Math.floor(overdueDuration / (90 * 60 * 1000)))
                      : -1;
                    const overdueRowClass = [
                      'bg-red-50 hover:bg-red-100',
                      'bg-red-100 hover:bg-red-200',
                      'bg-red-200 hover:bg-red-300',
                      'bg-red-300 hover:bg-red-400',
                    ][overdueLevel];

                    return (
                      <tr
                        key={item.assignmentId}
                        className={`transition ${isOverdue ? overdueRowClass : 'hover:bg-surface-muted'}`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-text-primary">{item.eventName}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-text-secondary">{item.task}</p>
                        </td>

                        <td className="px-6 py-4">
                          {item.deadline ? (
                            <p className="text-sm text-text-secondary">
                              {new Date(item.deadline).toLocaleString([], {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          ) : (
                            <p className="text-sm text-text-placeholder">No deadline</p>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge context="task" status={item.status} />
                        </td>

                        <td className="px-6 py-4">
                          {item.status.toLowerCase() === 'completed' ? (
                            <span className="text-sm font-medium text-green-600">Completed</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => markAsCompleted(item.assignmentId)}
                              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                            >
                              Mark as Completed
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyTasksPage;
