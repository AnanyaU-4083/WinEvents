import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import {
  InteractionStatus,
  type RedirectRequest,
} from '@azure/msal-browser'

function Login() {

  const { instance, accounts, inProgress } = useMsal()

  const navigate = useNavigate()

  const loginRequest: RedirectRequest = {
    scopes: ['User.Read'],
  }
  

  useEffect(() => {

    if (accounts.length > 0) {

      instance.setActiveAccount(accounts[0])

      navigate('/dashboard', {
        replace: true,
      })

      return
    }

    if (inProgress === InteractionStatus.None) {

      instance.loginRedirect(loginRequest)

    }

  }, [
    accounts,
    inProgress,
    instance,
    navigate,
  ])

  return (
    <div className="login-page">

      <div className="login-card">

        <h1>
          WinEvents
        </h1>

        <p>
          Redirecting to Microsoft login...
        </p>

      </div>

    </div>
  )
}

export default Login