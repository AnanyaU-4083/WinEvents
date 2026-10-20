// Send authenticated backend API requests.
import { env } from '../../config/env';

export async function apiRequest(input: string | URL, init?: RequestInit): Promise<Response> {
  const path = String(input);
  const url = path.startsWith('http') ? path : `${env.VITE_API_BASE_URL ?? ''}${path}`;
  const response = await fetch(url, init);

  return response;
}
