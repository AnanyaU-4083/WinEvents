// Initialize application translations and language.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const defaultNS = 'common';

export const resources = {
  en: {
    common: {
      loadingPage: 'Loading page...',
      notFoundTitle: 'Page not found',
      notFoundMessage: 'The page you requested could not be found.',
      returnToDashboard: 'Return to dashboard',
      routeErrorTitle: 'This page could not be loaded',
      routeErrorMessage: 'Try refreshing the page or return to the dashboard.',
      navigation: {
        dashboard: 'Dashboard',
        events: 'Events',
        participants: 'Participants',
        tasks: 'My Tasks',
        administration: 'Administration',
        goToDashboard: 'Go to dashboard',
      },
      dashboard: {
        welcomeBack: "Welcome back! Here's what's happening with your events.",
        welcome: 'Welcome, {{name}}',
      },
    },
  },
} as const;

export const i18nReady = i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
