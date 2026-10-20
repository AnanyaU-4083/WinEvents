// Provide reusable task status utilities.
export interface TaskStatusInfo {
  status: string | number;
  deadline: string | null;
  eventEndDate: string | null;
}

// Convert task statuses into labels.
export function normalizedTaskStatus(status: string | number): string {
  const value = String(status).toLowerCase();
  const labels: Record<string, string> = {
    '0': 'Pending',
    '1': 'In Progress',
    '2': 'Completed',
    '3': 'Declined',
  };
  return labels[value] ?? String(status);
}

export function isFinalTaskStatus(status: string | number): boolean {
  const normalized = normalizedTaskStatus(status).toLowerCase();
  return normalized === 'completed' || normalized === 'declined';
}

// Check whether task deadline passed.
export function isTaskOverdue(deadline: string | null, status: string | number, currentTime: number): boolean {
  if (!deadline || isFinalTaskStatus(status)) return false;
  const deadlineTime = new Date(deadline).getTime();
  return Number.isFinite(deadlineTime) && currentTime > deadlineTime;
}

// Increase urgency as delays grow.
export function taskOverdueLevel(task: TaskStatusInfo, currentTime: number): number {
  if (!isTaskOverdue(task.deadline, task.status, currentTime) || !task.deadline) return 0;
  const elapsed = currentTime - new Date(task.deadline).getTime();
  return Math.min(4, Math.floor(elapsed / (90 * 60 * 1000)) + 1);
}

// Format task deadlines for display.
export function formatTaskDeadline(deadline: string | null): string {
  if (!deadline) return 'No deadline';
  const date = new Date(deadline);
  if (!Number.isFinite(date.getTime())) return 'Invalid deadline';
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Mark tasks after event end.
export function isEventOccurredIncomplete(task: TaskStatusInfo, currentTime: number): boolean {
  if (!task.eventEndDate || !isTaskOverdue(task.deadline, task.status, currentTime)) return false;
  const eventEnd = new Date(task.eventEndDate).getTime();
  return Number.isFinite(eventEnd) && eventEnd < currentTime;
}