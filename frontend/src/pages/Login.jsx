import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import InputField from '../components/InputField'
import { requestOtp } from '../api'

const Login = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }
    setError('')
    setLoading(true)
    try {
      await requestOtp(email)
      navigate('/otp', { state: { email } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <h1 className="brand-wordmark">lifesafe</h1>
      <h2 className="form-title">Create an account</h2>
      <p className="form-subtitle">Enter your email to sign up for this app</p>
      <form className="login-form" onSubmit={handleSubmit}>
        <InputField
          type="email"
          placeholder="email@domain.com"
          icon="mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Sending…' : 'Continue'}
        </button>
      </form>
      <p className="signup-text fine-print">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
      </p>
    </div>
  )
}

export default Login
