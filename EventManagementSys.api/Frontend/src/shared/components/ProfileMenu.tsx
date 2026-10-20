// Manage signed-in user options here.
import { useEffect, useRef, useState } from 'react';
import { useMsal } from '@azure/msal-react';

function ProfileMenu() {
  const { instance, accounts } = useMsal();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const account = instance.getActiveAccount() ?? accounts[0];
  const roles = (account?.idTokenClaims?.roles as string[]) ?? [];

  const role = ['Admin', 'Employee', 'Attendee'].find((item) => roles.includes(item)) ?? 'User';

  const name = account?.name || account?.username || 'User';

  const initials =
    name
      .trim()
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'U';

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = () => {
    void instance.logoutRedirect({
      account,
      postLogoutRedirectUri: window.location.origin,
    });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        className="flex items-center gap-3 rounded-full p-1.5 pr-3 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white ring-2 ring-blue-100">
          {initials}
        </span>

        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-44 truncate text-sm font-semibold text-gray-800">
            {name}
          </span>
          <span className="block text-xs text-gray-500">{role}</span>
        </span>

        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.09 1.032l-4.25 4.51a.75.75 0 01-1.09 0l-4.25-4.51a.75.75 0 01.02-1.052z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="glass-popup absolute right-0 z-50 mt-3 w-64 overflow-hidden"
        >
          <div className="border-b border-gray-100 px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                <p className="truncate text-xs text-gray-500">{account?.username}</p>
                <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {role}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5m5 5H3"
              />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
