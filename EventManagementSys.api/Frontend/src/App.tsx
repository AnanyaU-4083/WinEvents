import { BrowserRouter, Navigate, Route, Routes, Outlet } from 'react-router-dom'

import Login from './Components/Login'
import Navigationbar from './Components/Navigationbar'

import Dashboard from './Pages/Dashboard'
import Events from './Pages/Events'
import Participants from './Pages/Participants'
import Administration from './Pages/Administration'

import './App.css'

function MainLayout() {
  return (
    <div className="app">
      <Navigationbar />

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Microsoft Login */}
        <Route path="/" element={<Login />} />

        {/* Main application */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/participants" element={<Participants />} />
          <Route path="/administration" element={<Administration />} />
        </Route>

        {/* Invalid URL */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App