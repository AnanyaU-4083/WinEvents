import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';

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

  async loadTasks(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const response = await this.request('/api/employees/my-tasks');
      if (!response.ok) {
        throw new Error(`Failed to load tasks. Status: ${response.status}`);
      }

      this.tasks.set((await response.json()) as EmployeeTask[]);
    } catch (error) {
      console.error('Failed to load employee tasks:', error);
      this.error.set('Unable to load your assigned tasks. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async markAsCompleted(task: EmployeeTask): Promise<void> {
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
      this.notice.set(`“${task.task}” is marked complete.`);
    } catch (error) {
      console.error('Failed to mark task as completed:', error);
      this.error.set('Unable to mark the task as completed. Please try again.');
    } finally {
      this.savingAssignmentId.set(null);
    }
  }

  confirmDecline(task: EmployeeTask): void {
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

    this.savingAssignmentId.set(task.assignmentId);
    this.error.set('');
    this.notice.set('');

    try {
      const response = await this.request(`/api/staff/${task.assignmentId}/decline`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Failed to decline task. Status: ${response.status}`);
      }

      this.replaceTask(task.assignmentId, { ...task, status: 'Declined' });
      this.taskToDecline.set(null);
      this.notice.set(`“${task.task}” has been declined.`);
    } catch (error) {
      console.error('Failed to decline employee task:', error);
      this.error.set('Unable to decline this task. Please try again.');
    } finally {
      this.savingAssignmentId.set(null);
    }
  }

  isOverdue(task: EmployeeTask): boolean {
    if (!task.deadline || this.isFinalStatus(task.status)) return false;
    const deadline = new Date(task.deadline).getTime();
    return Number.isFinite(deadline) && this.currentTime() > deadline;
  }

  overdueLevel(task: EmployeeTask): number {
    if (!this.isOverdue(task) || !task.deadline) return 0;
    const elapsed = this.currentTime() - new Date(task.deadline).getTime();
    return Math.min(4, Math.floor(elapsed / (90 * 60 * 1000)) + 1);
  }

  formatDeadline(deadline: string | null): string {
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

  isFinalStatus(status: string): boolean {
    return ['completed', 'declined'].includes(status.toLowerCase());
  }

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
