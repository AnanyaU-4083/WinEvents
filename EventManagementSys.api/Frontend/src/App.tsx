import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Outlet,
} from 'react-router-dom'

import { useMsal } from '@azure/msal-react'
import type { ReactNode } from 'react'


import Login from './Components/Login'
import Navigationbar from './Components/Navigationbar'

import Dashboard from './Pages/Dashboard'
import Events from './Pages/Events'
import Participants from './Pages/Participants'
import Administration from './Pages/Administration'
import EmployeeTasks from './Pages/EmployeeTasks'


function MainLayout() {

  return (

    <div className="min-h-screen bg-[#f5f8fc]">

      <Navigationbar />

      <main className="min-h-[calc(100vh-73px)]">
        <Outlet />
      </main>

    </div>

  )
}


/*
 * Protect a page based on Microsoft
 * Entra roles.
 */
function RoleRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: string[]
  children: ReactNode
}) {

  const { instance, accounts } = useMsal()

  const account =
    instance.getActiveAccount() ?? accounts[0]

  const roles =
    (account?.idTokenClaims?.roles as string[]) ?? []

  const hasPermission =
    allowedRoles.some(
      (role) => roles.includes(role)
    )

  if (!hasPermission) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return children
}


function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* Login */}

        <Route
          path="/"
          element={<Login />}
        />


        {/* Main application */}

        <Route element={<MainLayout />}>

          {/* Dashboard */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />


          {/* Events */}

          <Route
            path="/events"
            element={<Events />}
          />


          {/* Participants
              Admin + Employee only
          */}

          <Route
            path="/participants"
            element={
              <RoleRoute
                allowedRoles={[
                  'Admin',
                  'Employee',
                ]}
              >
                <Participants />
              </RoleRoute>
            }
          />


          {/* Employee Tasks
              Employee only
          */}

          <Route
            path="/my-tasks"
            element={
              <RoleRoute
                allowedRoles={[
                  'Admin',
                  'Employee',
                ]}
              >
                <EmployeeTasks />
              </RoleRoute>
            }
          />


          {/* Administration
              Admin only
          */}

          <Route
            path="/administration"
            element={
              <RoleRoute
                allowedRoles={[
                  'Admin',
                ]}
              >
                <Administration />
              </RoleRoute>
            }
          />

        </Route>


        {/* Unknown route */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>

  )
}

export default App