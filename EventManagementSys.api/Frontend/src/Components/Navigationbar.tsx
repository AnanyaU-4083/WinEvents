import { useMsal } from '@azure/msal-react'
import { NavLink, useNavigate } from 'react-router-dom'

import ProfileMenu from './ProfileMenu'
import EventNotifications from './EventNotifications'

function Navigationbar() {
  const { instance, accounts } = useMsal()
  const navigate = useNavigate()

  const account = accounts[0]

  // Get the roles assigned to the Microsoft account
  const roles =
    (account?.idTokenClaims?.roles as string[]) ?? []

  // Temporary check to see which Microsoft roles are available
  console.log('Microsoft roles:', roles)

  const isAdmin = roles.includes('Admin')
  const isEmployee = roles.includes('Employee')

  const canViewParticipants =
    isAdmin || isEmployee

  const canViewAdministration =
    isAdmin

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri:
        window.location.origin,
    })
  }

  return (
    <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4 shadow-sm">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-10">

        {/* LOGO */}
        <div
          className="cursor-pointer text-2xl font-bold"
          onClick={() => navigate('/dashboard')}
        >
          <span className="text-blue-600">
            Win
          </span>

          <span className="text-orange-500">
            Events
          </span>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="flex items-center gap-6">

          {/* DASHBOARD */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`
            }
          >
            Dashboard
          </NavLink>

          {/* EVENTS */}
          <NavLink
            to="/events"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`
            }
          >
            Events
          </NavLink>

          {/* PARTICIPANTS */}
          {canViewParticipants && (
            <NavLink
              to="/participants"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`
              }
            >
              Participants
            </NavLink>
          )}

          {/* MY TASKS */}
          {(isAdmin || isEmployee) && (
            <NavLink
              to="/my-tasks"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`
              }
            >
              My Tasks
            </NavLink>
          )}

          {/* ADMINISTRATION */}
          {canViewAdministration && (
            <NavLink
              to="/administration"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`
              }
            >
              Administration
            </NavLink>
          )}
          

        </div>
      </div>

      {/* RIGHT SIDE: NOTIFICATIONS AND PROFILE */}
      <div className="flex shrink-0 items-center gap-3">
        <EventNotifications />
        <ProfileMenu />
      </div>

    </nav>
  )
}

export default Navigationbar