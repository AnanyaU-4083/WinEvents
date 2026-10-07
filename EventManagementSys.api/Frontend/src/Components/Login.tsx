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
    <div className="flex min-h-screen items-center justify-center bg-[#f5f8fc] px-4">

      <div className="w-full max-w-md rounded-2xl border border-[#dfe5ec] bg-white p-8 text-center shadow-[0_6px_20px_rgba(15,23,42,0.08)]">

        <h1 className="text-3xl font-bold">
          <span className="text-[#0066ff]">
            Win
          </span>
          <span className="text-[#ff7a00]">
            Events
          </span>
        </h1>

        <p className="mt-3 text-sm text-[#6b7280]">
          Redirecting to Microsoft login...
        </p>

      </div>

    </div>
  )
}

export default Login