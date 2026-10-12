
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'

import './index.css'
import '@syncfusion/ej2-tailwind3-theme/styles/schedule/index.css'

import App from './App'
import { msalInstance } from './auth/msalInstance'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

async function startApp() {
  // Initialize MSAL before rendering the application
  await msalInstance.initialize()

  createRoot(rootElement).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </StrictMode>,
  )
}

startApp().catch((error) => {
  console.error('Failed to start application:', error)
})
