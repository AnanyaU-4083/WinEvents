// Bootstrap the Angular task application.
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { MyTasksComponent } from './my-tasks/my-tasks.component';

async function registerMyTasksElement(): Promise<void> {
  const application = await createApplication({ providers: [] });
  const customElement = createCustomElement(MyTasksComponent, {
    injector: application.injector,
  });

  if (!customElements.get('my-tasks-angular')) {
    customElements.define('my-tasks-angular', customElement);
  }
}

void registerMyTasksElement();
