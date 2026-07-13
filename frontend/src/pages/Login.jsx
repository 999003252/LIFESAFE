import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InputField from '../components/InputField'

const Login = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }
    setError('')
    navigate('/otp', { state: { email } })
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
          Don't have an account?{" "}
          <Link to="/create-account">Create one here</Link>
        </p>    

        <p className="signup-text fine-print">
          By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}

export default Login
