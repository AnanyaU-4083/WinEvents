// Manage task actions and status.
import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import {
  formatTaskDeadline,
  isEventOccurredIncomplete as checkEventOccurredIncomplete,
  isFinalTaskStatus,
  isTaskOverdue,
  normalizedTaskStatus,
  taskOverdueLevel,
} from './task-helpers';

// Describe the employee task record.
interface EmployeeTask {
  assignmentId: number;
  eventId: number;
  eventName: string;
  eventEndDate: string | null;
  employeeId: number;
  name: string;
  jobTitle: string;
  task: string;
  deadline: string | null;
  status: string | number;
}

type TaskFilter = 'all' | 'assigned' | 'incomplete' | 'completed' | 'declined';

@Component({
  selector: 'app-my-tasks-angular',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-tasks.component.html',
  styleUrl: './my-tasks.component.css',
})
export class MyTasksComponent implements OnInit, OnDestroy {
  @Input() tokenProvider: (() => Promise<string>) | null = null;
  @Input() apiBaseUrl = '';

  readonly tasks = signal<EmployeeTask[]>([]);
  readonly taskFilter = signal<TaskFilter>('all');
  readonly visibleTasks = computed(() => {
    const filter = this.taskFilter();
    const tasks = this.tasks();
    const matchesFilter = (task: EmployeeTask) => {
      const status = this.normalizedStatus(task.status).toLowerCase();
      const incomplete = this.isEventOccurredIncomplete(task);
      if (filter === 'assigned')
        return status !== 'completed' && status !== 'declined' && !incomplete;
      if (filter === 'incomplete') return incomplete;
      if (filter === 'completed') return status === 'completed';
      if (filter === 'declined') return status === 'declined';
      return true;
    };
    const priority = (task: EmployeeTask) => {
      const status = this.normalizedStatus(task.status).toLowerCase();
      if (this.isEventOccurredIncomplete(task)) return 1;
      return status === 'completed' ? 2 : status === 'declined' ? 3 : 0;
    };
    return tasks
      .filter(matchesFilter)
      .slice()
      .sort((a, b) => priority(a) - priority(b));
  });
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notice = signal('');
  readonly currentTime = signal(Date.now());
  readonly savingAssignmentId = signal<number | null>(null);
  readonly taskToDecline = signal<EmployeeTask | null>(null);

  private timerId: number | undefined;

  async ngOnInit(): Promise<void> {
    this.timerId = window.setInterval(() => this.currentTime.set(Date.now()), 15_000);
    await this.loadTasks();
  }

  ngOnDestroy(): void {
    if (this.timerId !== undefined) {
      window.clearInterval(this.timerId);
    }
  }

  // Load task data with dates.
  async loadTasks(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const [taskResponse, eventResponse] = await Promise.all([
        this.request('/api/employees/my-tasks'),
        this.request('/api/events'),
      ]);
      if (!taskResponse.ok || !eventResponse.ok) {
        throw new Error(
          `Failed to load tasks or event dates. Status: ${taskResponse.status}/${eventResponse.status}`,
        );
      }

      const [tasks, events] = await Promise.all([
        taskResponse.json() as Promise<EmployeeTask[]>,
        eventResponse.json() as Promise<Array<{ eventId: number; endDate: string }>>,
      ]);
      const eventEndDates = new Map(events.map((event) => [event.eventId, event.endDate]));
      this.tasks.set(
        tasks.map((task) => ({ ...task, eventEndDate: eventEndDates.get(task.eventId) ?? null })),
      );
    } catch (error) {
      console.error('Failed to load employee tasks:', error);
      this.error.set('Unable to load your assigned tasks. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  // Mark an assignment as complete.
  async markAsCompleted(task: EmployeeTask): Promise<void> {
    if (this.isEventOccurredIncomplete(task)) return;
    this.savingAssignmentId.set(task.assignmentId);
    this.error.set('');
    this.notice.set('');

    try {
      const response = await this.request(`/api/staff/${task.assignmentId}`, {
        method: 'PUT',
        body: JSON.stringify({ task: task.task, deadline: task.deadline, status: 2 }),
      });
      if (!response.ok) {
        throw new Error(`Failed to complete task. Status: ${response.status}`);
      }

      this.replaceTask(task.assignmentId, { ...task, status: 'Completed' });
      this.notice.set(`Task "${task.task}" is marked complete.`);
    } catch (error) {
      console.error('Failed to mark task as completed:', error);
      this.error.set('Unable to mark the task as completed. Please try again.');
    } finally {
      this.savingAssignmentId.set(null);
    }
  }

  // Confirm before declining assigned tasks.
  confirmDecline(task: EmployeeTask): void {
    if (this.isEventOccurredIncomplete(task)) return;
    this.taskToDecline.set(task);
    this.error.set('');
    this.notice.set('');
  }

  cancelDecline(): void {
    this.taskToDecline.set(null);
  }

  async declineTask(): Promise<void> {
    const task = this.taskToDecline();
    if (!task) return;
    if (this.isEventOccurredIncomplete(task)) {
      this.taskToDecline.set(null);
      return;
    }

    this.savingAssignmentId.set(task.assignmentId);
    this.error.set('');
    this.notice.set('');

    try {
      const response = await this.request(`/api/staff/${task.assignmentId}`, {
        method: 'PUT',
        body: JSON.stringify({ task: task.task, deadline: task.deadline, status: 3 }),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to opt out. Status: ${response.status}`);
      }

      this.replaceTask(task.assignmentId, { ...task, status: 'Declined' });
      this.taskToDecline.set(null);
      this.notice.set(`Task "${task.task}" has been declined.`);
    } catch (error) {
      console.error('Failed to decline employee task:', error);
      this.error.set(error instanceof Error ? error.message : 'Unable to opt out of this task.');
    } finally {
      this.savingAssignmentId.set(null);
    }
  }

  isOverdue(task: EmployeeTask): boolean {
    return isTaskOverdue(task.deadline, task.status, this.currentTime());
  }

  overdueLevel(task: EmployeeTask): number {
    return taskOverdueLevel(task, this.currentTime());
  }

  formatDeadline(deadline: string | null): string {
    return formatTaskDeadline(deadline);
  }

  isEventOccurredIncomplete(task: EmployeeTask): boolean {
    return checkEventOccurredIncomplete(task, this.currentTime());
  }

  normalizedStatus(status: string | number): string {
    return normalizedTaskStatus(status);
  }

  displayStatus(task: EmployeeTask): string {
    return this.isEventOccurredIncomplete(task)
      ? 'Event Occurred, Task Incomplete'
      : this.normalizedStatus(task.status);
  }

  setTaskFilter(value: string): void {
    if (
      value === 'all' ||
      value === 'assigned' ||
      value === 'incomplete' ||
      value === 'completed' ||
      value === 'declined'
    ) {
      this.taskFilter.set(value);
    }
  }

  statusClass(task: EmployeeTask): string {
    return this.isEventOccurredIncomplete(task)
      ? 'status event-incomplete'
      : `status ${this.normalizedStatus(task.status).toLowerCase().replaceAll(' ', '-')}`;
  }

  isFinalStatus(status: string | number): boolean {
    return isFinalTaskStatus(status);
  }
  // Attach authentication to API requests.
  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    if (!this.tokenProvider) {
      throw new Error('Authentication is not ready. Please refresh the page.');
    }

    const accessToken = await this.tokenProvider();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    if (init.body) headers.set('Content-Type', 'application/json');

    return fetch(`${this.apiBaseUrl}${path}`, { ...init, headers });
  }

  private replaceTask(assignmentId: number, updatedTask: EmployeeTask): void {
    this.tasks.update((current) =>
      current.map((task) => (task.assignmentId === assignmentId ? updatedTask : task)),
    );
  }
}
