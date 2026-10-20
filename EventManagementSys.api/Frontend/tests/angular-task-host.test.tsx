import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MyTaskPageAngular from '../src/features/tasks/pages/MyTaskPageAngular';

const auth = vi.hoisted(() => ({ getAccessToken: vi.fn(async () => 'test-token') }));
vi.mock('../src/shared/hooks/useAccessToken', () => ({
  useAccessToken: () => ({ getAccessToken: auth.getAccessToken }),
}));

beforeEach(() => {
  auth.getAccessToken.mockClear();
  document.head.querySelectorAll('script[src*="/angular/my-tasks/"]').forEach((script) => script.remove());
  document.head.querySelectorAll('link[href*="/angular/my-tasks/"]').forEach((link) => link.remove());
});

describe('Angular My Tasks host', () => {
  it('shows loading and a helpful error when the Angular bundle cannot load', async () => {
    render(<MyTaskPageAngular />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading My Tasks...');

    const polyfillsScript = await waitFor(() => {
      const script = document.head.querySelector<HTMLScriptElement>(
        'script[src*="/angular/my-tasks/browser/polyfills.js"]',
      );
      expect(script).not.toBeNull();
      return script!;
    });
    fireEvent.error(polyfillsScript);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load My Tasks. Please refresh the page.',
    );
  });

  it('mounts the Angular element and supplies the current access-token provider', async () => {
    if (!customElements.get('my-tasks-angular')) {
      customElements.define('my-tasks-angular', class extends HTMLElement {});
    }

    render(<MyTaskPageAngular />);
    const angularElement = await waitFor(() => {
      const element = document.querySelector<HTMLElement>('my-tasks-angular');
      expect(element).not.toBeNull();
      return element as HTMLElement & {
        apiBaseUrl: string;
        tokenProvider: () => Promise<string>;
      };
    });

    expect(angularElement.apiBaseUrl).toBe('');
    await expect(angularElement.tokenProvider()).resolves.toBe('test-token');
    expect(auth.getAccessToken).toHaveBeenCalledOnce();
  });
});
