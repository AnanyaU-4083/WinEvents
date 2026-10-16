import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text?: () => Promise<string>;
};

export type ApiMock = (url: string, init?: RequestInit) => Promise<MockResponse>;

let apiMock: ApiMock = async () => ({
  ok: false,
  status: 501,
  json: async () => ({ message: 'No mock configured for this request.' }),
  text: async () => 'No mock configured for this request.',
});

export function setApiMock(mock: ApiMock) {
  apiMock = mock;
}

export const server = setupServer(
  http.all('*', async ({ request }) => {
    const url = new URL(request.url);
    const headers = Object.fromEntries(
      [...request.headers.entries()]
        .filter(
          ([name]) =>
            ![
              'accept',
              'accept-encoding',
              'accept-language',
              'connection',
              'host',
              'sec-fetch-mode',
              'user-agent',
            ].includes(name),
        )
        .map(([name, value]) => [name === 'authorization' ? 'Authorization' : name, value]),
    );
    const init: RequestInit = {};
    if (request.method !== 'GET') init.method = request.method;
    if (Object.keys(headers).length > 0) init.headers = headers;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = await request.text();
    }

    const requestUrl = `${url.pathname}${url.search}`;
    const response =
      Object.keys(init).length > 0 ? await apiMock(requestUrl, init) : await apiMock(requestUrl);
    const body =
      response.status === 204
        ? null
        : response.text
          ? await response.text()
          : JSON.stringify(await response.json());
    return new HttpResponse(body, { status: response.status });
  }),
);
