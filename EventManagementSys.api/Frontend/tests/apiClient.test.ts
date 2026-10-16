import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../src/shared/api/apiClient';

describe('apiRequest', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('combines relative API paths with the configured base URL', async () => {
    const response = new Response('ok');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);

    await expect(apiRequest('/api/events')).resolves.toBe(response);

    expect(fetchMock).toHaveBeenCalledWith('/api/events', undefined);
  });

  it('passes absolute URLs directly to fetch', async () => {
    const response = new Response('ok');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);

    await expect(apiRequest('https://api.example.test/events')).resolves.toBe(response);

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/events', undefined);
  });
});
