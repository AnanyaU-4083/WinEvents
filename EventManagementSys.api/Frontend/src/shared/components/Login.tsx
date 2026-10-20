// Start the Microsoft sign-in flow.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus, type RedirectRequest } from '@azure/msal-browser';

const loginRequest: RedirectRequest = {
  scopes: ['User.Read'],
};

function Login() {
  const { instance, accounts, inProgress } = useMsal();

  const navigate = useNavigate();

  useEffect(() => {
    const account = accounts[0];
    if (account) {
      instance.setActiveAccount(account);

      navigate('/dashboard', {
        replace: true,
      });

      return;
    }

    if (inProgress === InteractionStatus.None) {
      instance.loginRedirect(loginRequest);
    }
  }, [accounts, inProgress, instance, navigate]);

  return (
    <div className="page-canvas flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel w-full max-w-md p-8 text-center">
        <h1 className="text-3xl font-bold">
          <span className="text-brand-primary">Win</span>
          <span className="text-accent-orange">Events</span>
        </h1>

        <p className="mt-3 text-sm text-text-muted">Redirecting to Microsoft login...</p>
      </div>
    </div>
  );
}

export default Login;
