import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import InputField from '../components/InputField'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const Login = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }
    try {
      const response = await fetch(`${API_BASE}/accounts/exists?email=${encodeURIComponent(email.trim())}`)
      const account = await response.json()

      if (!response.ok) throw new Error()
      if (!account.exists) {
        navigate('/create-account', { state: { email: email.trim() } })
        return
      }

      setError('')
      navigate('/otp', { state: { email: email.trim() } })
    } catch {
      setError('Could not check this account. Please try again.')
    }
  }

  return (
    <div className="auth-page">
      <div className="login-container">
        <h1 className="brand-wordmark">lifesafe</h1>
        <h2 className="form-title">Login to your account</h2>
        <p className="form-subtitle">Enter your email to login</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <InputField
            type="email"
            placeholder="email@domain.com"
            icon="mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="login-button">
            Continue
          </button>
        </form>

        <p className="create-account-link">
          New to lifesafe? <Link to="/create-account">Create an account</Link>
        </p>

        <p className="signup-text fine-print">
          By clicking continue, you agree to our{' '}
          <Link to="/terms" state={{ from: location.pathname }}>Terms of Service</Link>{' '}
          and{' '}
          <Link to="/privacy" state={{ from: location.pathname }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
