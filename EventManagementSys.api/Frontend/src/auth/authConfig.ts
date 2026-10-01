import { Configuration, LogLevel } from '@azure/msal-browser'

export const msalConfig: Configuration = {
  auth: {
    clientId: '0332cc25-1dc3-4542-b1cd-a1ad23d0f620',
    authority: 'https://login.microsoftonline.com/bdcfaa46-3f69-4dfd-b3f7-c582bdfbb820',
    redirectUri: 'http://localhost:5173/',
  },

  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },

  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return
        }

        switch (level) {
          case LogLevel.Error:
            console.error(message)
            break

          case LogLevel.Warning:
            console.warn(message)
            break

          case LogLevel.Info:
            console.info(message)
            break
        }
      },
    },
  },
}