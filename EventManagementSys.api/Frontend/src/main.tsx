import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'

import './index.css'
import App from './App'
import { msalInstance } from './auth/msalInstance'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

async function startApp() {
  // Initialize MSAL before using MsalProvider
  await msalInstance.initialize()

  createRoot(rootElement).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </StrictMode>,
  )
}

startApp()