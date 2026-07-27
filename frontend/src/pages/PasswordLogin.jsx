import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import InputField from '../components/InputField'
import { setAuth } from '../auth'
import { ensureProfile } from '../api/friends'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function PasswordLogin() {
  const location = useLocation()
  const navigate = useNavigate()

  const email = location.state?.email

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (!email) {
    return <Navigate to="/login" replace />
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!password.trim()) {
      setError("Please enter your password")
      return
    }

    try {
      const response = await fetch(
        "https://hsvynbsv5e.execute-api.us-east-1.amazonaws.com/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data)
      }

      setAuth(email)

      try {
        await ensureProfile(email)
      } catch {}

      navigate("/", { replace: true })

    } catch {
      setError("Incorrect email or password")
    }
  }


  return (
    <div className="auth-page">
      <div className="login-container">

        <h1 className="brand-wordmark">
          lifesafe
        </h1>

        <h2 className="form-title">
          Enter your password
        </h2>

        <p className="form-subtitle">
          Welcome back
        </p>

        <form className="login-form" onSubmit={handleLogin}>

          <InputField
            type="password"
            placeholder="Password"
            icon="lock"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />

          {error && <p className="form-error">{error}</p>}

          <button className="login-button">
            Login
          </button>

        </form>

      </div>
    </div>
  )
}