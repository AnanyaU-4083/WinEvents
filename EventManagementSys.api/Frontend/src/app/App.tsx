// Protect routes with application roles.
import { Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createBrowserRouter,
  Navigate,
  Link,
  Outlet,
  RouterProvider,
  useRouteError,
  type RouteObject,
} from 'react-router-dom';

import { useMsal } from '@azure/msal-react';
import type { ReactNode } from 'react';

import Login from '../shared/components/Login';
import Navigationbar from '../shared/components/Navigationbar';
import { AppProviders } from './providers/AppProviders';
import '../i18n';

function RouteLoading() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-64 items-center justify-center" role="status">
      <span>{t('loadingPage')}</span>
    </div>
  );
}

function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();
  console.error('Route failed to load:', error);

  return (
    <section className="mx-auto max-w-2xl p-8" role="alert">
      <h1 className="text-xl font-semibold">{t('routeErrorTitle')}</h1>
      <p className="mt-2">{t('routeErrorMessage')}</p>
    </section>
  );
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-semibold">{t('notFoundTitle')}</h1>
      <p className="mt-2">{t('notFoundMessage')}</p>
      <Link className="mt-4 inline-block underline" to="/dashboard">
        {t('returnToDashboard')}
      </Link>
    </section>
  );
}

function MainLayout() {
  return (
    <div className="page-canvas min-h-screen">
      <Navigationbar />

      <main className="min-h-[calc(100vh-73px)]">
        <Suspense fallback={<RouteLoading />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

//Protect pages by Entra roles.
function RoleRoute({ allowedRoles, children }: { allowedRoles: string[]; children: ReactNode }) {
  const { instance, accounts } = useMsal();

  const account = instance.getActiveAccount() ?? accounts[0];

  const roles = (account?.idTokenClaims?.roles as string[]) ?? [];

  const hasPermission = allowedRoles.some((role) => roles.includes(role));

  if (!hasPermission) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function createRoutes(): RouteObject[] {
  return [
    {
      path: '/',
      element: <Login />,
      errorElement: <RouteError />,
    },
    {
      element: <MainLayout />,
      errorElement: <RouteError />,
      HydrateFallback: RouteLoading,
      children: [
        {
          path: '/dashboard',
          lazy: async () => ({ Component: (await import('../features/dashboard')).default }),
        },
        {
          path: '/events',
          lazy: async () => ({ Component: (await import('../features/events')).default }),
        },
        {
          path: '/events/:eventId',
          lazy: async () => ({ Component: (await import('../features/events')).default }),
        },
        {
          path: '/participants',
          element: (
            <RoleRoute allowedRoles={['Admin', 'Employee']}>
              <Outlet />
            </RoleRoute>
          ),
          children: [
            {
              index: true,
              lazy: async () => ({ Component: (await import('../features/participants')).default }),
            },
          ],
        },
        {
          path: '/my-tasks',
          element: (
            <RoleRoute allowedRoles={['Admin', 'Employee']}>
              <Outlet />
            </RoleRoute>
          ),
          children: [
            {
              index: true,
              lazy: async () => ({
                Component: (await import('../features/tasks/pages/MyTaskPageAngular')).default,
              }),
            },
          ],
        },
        {
          path: '/administration',
          element: (
            <RoleRoute allowedRoles={['Admin']}>
              <Outlet />
            </RoleRoute>
          ),
          children: [
            {
              index: true,
              lazy: async () => ({
                Component: (await import('../features/administration')).default,
              }),
            },
          ],
        },
        { path: '*', element: <NotFound /> },
      ],
    },
  ];
}

export function App() {
  const router = useMemo(() => createBrowserRouter(createRoutes()), []);
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
