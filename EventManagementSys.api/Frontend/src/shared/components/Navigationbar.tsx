// Navigate between application feature pages.
import { useMsal } from '@azure/msal-react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import ProfileMenu from './ProfileMenu';
import EventNotifications from './EventNotifications';

function Navigationbar() {
  const { accounts } = useMsal();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const account = accounts[0];

  // Get the roles assigned to the Microsoft account
  const roles = (account?.idTokenClaims?.roles as string[]) ?? [];

  // Temporary check to see which Microsoft roles are available

  const isAdmin = roles.includes('Admin');
  const isEmployee = roles.includes('Employee');

  const canViewParticipants = isAdmin || isEmployee;

  const canViewAdministration = isAdmin;

  const links = [
    { to: '/dashboard', label: t('navigation.dashboard'), visible: true },
    { to: '/events', label: t('navigation.events'), visible: true },
    {
      to: '/participants',
      label: t('navigation.participants'),
      visible: canViewParticipants,
    },
    { to: '/my-tasks', label: t('navigation.tasks'), visible: isAdmin || isEmployee },
    {
      to: '/administration',
      label: t('navigation.administration'),
      visible: canViewAdministration,
    },
  ].filter((link) => link.visible);

  const renderLinks = () =>
    links.map(({ to, label }) => (
      <NavLink
        key={to}
        to={to}
        onClick={() => setIsMenuOpen(false)}
        className={({ isActive }) =>
          `rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
            isActive
              ? 'bg-surface-blue text-brand-primary shadow-sm'
              : 'text-text-secondary hover:bg-surface-subtle hover:text-brand-primary'
          }`
        }
      >
        {label}
      </NavLink>
    ));

  return (
    <nav className="app-nav sticky top-0 z-50 border-b border-blue-200/80 bg-white/82 px-4 py-3 shadow-[0_4px_18px_rgba(15,35,55,0.06)] backdrop-blur-xl sm:px-8 sm:py-3">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 lg:gap-10">
          <Link
            to="/dashboard"
            aria-label={t('navigation.goToDashboard')}
            className="shrink-0 text-[1.7rem] font-extrabold tracking-[-0.06em]"
          >
            <span className="text-blue-500">Win</span>
            <span className="text-orange-500">Events</span>
          </Link>

          <div className="hidden items-center gap-1.5 lg:flex xl:gap-2">{renderLinks()}</div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <EventNotifications />
          <ProfileMenu />
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border-default bg-surface-subtle/70 text-xl text-text-secondary transition hover:border-blue-200 hover:bg-surface-blue lg:hidden"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? '\u00D7' : '\u2630'}
          </button>
        </div>
      </div>

      <div
        id="mobile-navigation"
        className={`${isMenuOpen ? 'grid' : 'hidden'} gap-4 border-t border-border-default pt-4 lg:hidden`}
      >
        {renderLinks()}
      </div>
    </nav>
  );
}

export default Navigationbar;
