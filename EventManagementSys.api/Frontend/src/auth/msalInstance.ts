import {
  PublicClientApplication,
  type Configuration,
} from '@azure/msal-browser'

const msalConfig: Configuration = {
  auth: {
    clientId: '0332cc25-1dc3-4542-b1cd-a1ad23d0f620',
    authority:
      'https://login.microsoftonline.com/bdcfaa46-3f69-4dfd-b3f7-c582bdfbb820',
    redirectUri: 'http://localhost:5173/',
  },
}

export const msalInstance =
  new PublicClientApplication(msalConfig)