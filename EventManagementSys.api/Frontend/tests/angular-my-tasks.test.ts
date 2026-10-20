import { describe, expect, it } from 'vitest';
import {
  formatTaskDeadline,
  isEventOccurredIncomplete,
  isFinalTaskStatus,
  isTaskOverdue,
  normalizedTaskStatus,
  taskOverdueLevel,
  type TaskStatusInfo,
} from '../angular-tasks/src/my-tasks/task-helpers';

const pendingTask: TaskStatusInfo = {
  status: 'Pending',
  deadline: '2026-10-19T08:00:00.000Z',
  eventEndDate: '2026-10-19T09:00:00.000Z',
};
const currentTime = new Date('2026-10-19T10:00:00.000Z').getTime();

describe('Angular My Tasks page task rules', () => {
  it('normalizes backend numeric statuses and recognizes final states', () => {
    expect(normalizedTaskStatus(0)).toBe('Pending');
    expect(normalizedTaskStatus(1)).toBe('In Progress');
    expect(normalizedTaskStatus(2)).toBe('Completed');
    expect(normalizedTaskStatus(3)).toBe('Declined');
    expect(isFinalTaskStatus('Completed')).toBe(true);
    expect(isFinalTaskStatus(3)).toBe(true);
    expect(isFinalTaskStatus('Pending')).toBe(false);
  });

  it('detects overdue tasks and escalates overdue styling up to level four', () => {
    expect(isTaskOverdue(pendingTask.deadline, pendingTask.status, currentTime)).toBe(true);
    expect(taskOverdueLevel(pendingTask, currentTime)).toBe(2);
    expect(taskOverdueLevel({ ...pendingTask, deadline: null }, currentTime)).toBe(0);
    expect(isTaskOverdue('invalid-date', 'Pending', currentTime)).toBe(false);
    expect(isTaskOverdue(pendingTask.deadline, 'Declined', currentTime)).toBe(false);
  });

  it('marks tasks incomplete only after both deadline and event have passed', () => {
    expect(isEventOccurredIncomplete(pendingTask, currentTime)).toBe(true);
    expect(
      isEventOccurredIncomplete({ ...pendingTask, eventEndDate: null }, currentTime),
    ).toBe(false);
    expect(
      isEventOccurredIncomplete(
        { ...pendingTask, eventEndDate: '2026-10-19T11:00:00.000Z' },
        currentTime,
      ),
    ).toBe(false);
    expect(
      isEventOccurredIncomplete({ ...pendingTask, status: 'Completed' }, currentTime),
    ).toBe(false);
  });

  it('formats missing and invalid deadlines for the task list', () => {
    expect(formatTaskDeadline(null)).toBe('No deadline');
    expect(formatTaskDeadline('invalid-date')).toBe('Invalid deadline');
    expect(formatTaskDeadline(pendingTask.deadline)).toContain('Oct 19, 2026');
  });
});