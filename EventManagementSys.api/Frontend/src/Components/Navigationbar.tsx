import { useMsal } from '@azure/msal-react'
import { NavLink, useNavigate } from 'react-router-dom'

function Navigationbar() {
  const { instance, accounts } = useMsal()
  const navigate = useNavigate()

  const account = accounts[0]

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin,
    })
  }

  return (
    <nav className="navbar">

      <div className="navbar-left">

        <div
          className="navbar-brand"
          onClick={() => navigate('/dashboard')}
        >
          <span className="brand-blue">Win</span>
          <span className="brand-orange">Events</span>
        </div>

        <div className="navbar-links">

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/events"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Events
          </NavLink>

          <NavLink
            to="/participants"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Participants
          </NavLink>

          <NavLink
            to="/administration"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Administration
          </NavLink>

        </div>
      </div>

      <div className="navbar-right">

        <span className="navbar-user">
          {account?.name || account?.username || 'User'}
        </span>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </nav>
  )
}

export default Navigationbar