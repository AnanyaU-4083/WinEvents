import { useCallback, useEffect, useRef, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import type { AccountInfo } from '@azure/msal-browser';
import { env } from '@/config/env';

const angularAssetBase = '/angular/my-tasks/browser';
const elementName = 'my-tasks-angular';
let angularElementLoad: Promise<void> | undefined;

interface MyTasksAngularElement extends HTMLElement {
  apiBaseUrl: string;
  tokenProvider: () => Promise<string>;
}

function loadStylesheet(): void {
  const href = `${angularAssetBase}/styles.css`;
  if (document.querySelector(`link[href="${href}"]`)) return;

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = href;
  document.head.append(stylesheet);
}

function loadModule(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load the Angular My Tasks page.'));
    document.head.append(script);
  });
}

function ensureAngularElement(): Promise<void> {
  if (customElements.get(elementName)) return Promise.resolve();
  if (angularElementLoad) return angularElementLoad;

  loadStylesheet();
  angularElementLoad = loadModule(`${angularAssetBase}/polyfills.js`)
    .then(() => loadModule(`${angularAssetBase}/main.js`))
    .then(() => customElements.whenDefined(elementName))
    .then(() => undefined)
    .catch((error: unknown) => {
      angularElementLoad = undefined;
      throw error;
    });

  return angularElementLoad;
}

function MyTaskPageAngular() {
  const { instance, accounts } = useMsal();
  const hostRef = useRef<HTMLDivElement>(null);
  const tokenProviderRef = useRef<() => Promise<string>>(async () => {
    throw new Error('Authentication is not ready.');
  });
  const [elementReady, setElementReady] = useState(false);
  const [loadError, setLoadError] = useState('');

  const getAccessToken = useCallback(async () => {
    const account: AccountInfo | undefined = instance.getActiveAccount() ?? accounts[0];
    if (!account) throw new Error('Please sign in before loading your tasks.');

    const response = await instance.acquireTokenSilent({
      scopes: ['api://0332cc25-1dc3-4542-b1cd-a1ad23d0f620/access_as_user'],
      account,
    });
    return response.accessToken;
  }, [accounts, instance]);

  useEffect(() => {
    tokenProviderRef.current = getAccessToken;
  }, [getAccessToken]);

  const provideAccessToken = useCallback(() => tokenProviderRef.current(), []);

  useEffect(() => {
    let active = true;
    void ensureAngularElement()
      .then(() => {
        if (active) setElementReady(true);
      })
      .catch((error: unknown) => {
        console.error('Failed to initialize Angular My Tasks:', error);
        if (active) setLoadError('Unable to load My Tasks. Please refresh the page.');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!elementReady || !hostRef.current) return;

    const element = document.createElement(elementName) as MyTasksAngularElement;
    element.apiBaseUrl = env.VITE_API_BASE_URL ?? '';
    element.tokenProvider = provideAccessToken;
    hostRef.current.replaceChildren(element);

    return () => {
      element.remove();
    };
  }, [elementReady, provideAccessToken]);

  return (
    <div className="min-h-[calc(100vh-73px)] bg-surface-blue-muted">
      {loadError ? (
        <p className="mx-auto max-w-3xl px-6 py-10 text-sm text-state-error" role="alert">
          {loadError}
        </p>
      ) : (
        <div ref={hostRef} aria-busy={!elementReady}>
          {!elementReady && (
            <p className="px-6 py-10 text-center text-sm text-text-muted" role="status">
              Loading My Tasks...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default MyTaskPageAngular;
