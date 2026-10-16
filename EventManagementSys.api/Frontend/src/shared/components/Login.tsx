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
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-accent/35 bg-white p-8 text-center shadow-card">
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
