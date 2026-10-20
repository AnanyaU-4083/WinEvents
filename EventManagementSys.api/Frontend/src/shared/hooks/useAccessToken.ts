// Acquire access tokens for APIs.
import { useCallback, useEffect, useRef } from 'react';
import { useMsal } from '@azure/msal-react';

const API_SCOPE = 'api://0332cc25-1dc3-4542-b1cd-a1ad23d0f620/access_as_user';
const DEFAULT_MISSING_ACCOUNT_MESSAGE = 'No Microsoft account is logged in.';

export function useAccessToken(missingAccountMessage = DEFAULT_MISSING_ACCOUNT_MESSAGE) {
  const { instance, accounts } = useMsal();
  const account = instance.getActiveAccount() ?? accounts[0];
  const accountRef = useRef(account);
  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  const getAccessToken = useCallback(async () => {
    const activeAccount = instance.getActiveAccount() ?? accountRef.current;
    if (!activeAccount) {
      throw new Error(missingAccountMessage);
    }

    const response = await instance.acquireTokenSilent({
      scopes: [API_SCOPE],
      account: activeAccount,
    });

    return response.accessToken;
  }, [instance, missingAccountMessage]);

  return { account, getAccessToken };
}