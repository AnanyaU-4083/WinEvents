// Host Angular tasks inside React.
import { useCallback, useEffect, useRef, useState } from 'react';
import { env } from '@/config/env';
import { useAccessToken } from '@/shared/hooks/useAccessToken';

const angularAssetBase = '/angular/my-tasks/browser';
const angularAssetVersion = 'task-actions-aligned-v4';
const elementName = 'my-tasks-angular';
let angularElementLoad: Promise<void> | undefined;

interface MyTasksAngularElement extends HTMLElement {
  apiBaseUrl: string;
  tokenProvider: () => Promise<string>;
}

function loadStylesheet(): void {
  const href = `${angularAssetBase}/styles.css?v=${angularAssetVersion}`;
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
  angularElementLoad = loadModule(`${angularAssetBase}/polyfills.js?v=${angularAssetVersion}`)
    .then(() => loadModule(`${angularAssetBase}/main.js?v=${angularAssetVersion}`))
    .then(() => customElements.whenDefined(elementName))
    .then(() => undefined)
    .catch((error: unknown) => {
      angularElementLoad = undefined;
      throw error;
    });

  return angularElementLoad;
}

function MyTaskPageAngular() {
  const { getAccessToken } = useAccessToken('Please sign in before loading your tasks.');
  const hostRef = useRef<HTMLDivElement>(null);
  const tokenProviderRef = useRef<() => Promise<string>>(async () => {
    throw new Error('Authentication is not ready.');
  });
  const [elementReady, setElementReady] = useState(false);
  const [loadError, setLoadError] = useState('');


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
    <div className="page-canvas min-h-[calc(100vh-73px)]">
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
