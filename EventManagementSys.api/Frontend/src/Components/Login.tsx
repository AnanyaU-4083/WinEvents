import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'

function Login() {
  const { instance, accounts } = useMsal()
  const navigate = useNavigate()

  useEffect(() => {
    if (accounts.length > 0) {
      navigate('/dashboard')
      return
    }

    const startMicrosoftLogin = async () => {
      try {
        await instance.loginRedirect()
      } catch (error) {
        console.error('Microsoft login failed:', error)
      }
    }

    startMicrosoftLogin()
  }, [instance, accounts, navigate])

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>WinEvents</h1>
        <p>Redirecting to Microsoft login...</p>
      </div>
    </div>
  )
}

export default Login