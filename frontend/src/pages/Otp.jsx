import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import InputField from '../components/InputField'
import { setAuth } from '../auth'
import { requestOtp, verifyOtp } from '../api'

const Otp = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  if (!email) {
    return <Navigate to="/login" replace />
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Please enter the code we sent you')
      return
    }
    setError('')
    setLoading(true)
    try {
      const token = await verifyOtp(email, code)
      setAuth(token)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setNote('')
    try {
      await requestOtp(email)
      setNote('OTP resent')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="login-container">
      <h1 className="brand-wordmark">lifesafe</h1>
      <h2 className="form-title">We sent you a OTP</h2>
      <p className="form-subtitle">Please check your email</p>
      <form className="login-form" onSubmit={handleLogin}>
        <InputField
          type="text"
          placeholder="Enter OTP"
          icon="lock"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {error && <p className="form-error">{error}</p>}
        {note && <p className="form-note">{note}</p>}
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Verifying…' : 'Login'}
        </button>
        <button type="button" className="secondary-button" onClick={handleResend}>Resend OTP</button>
      </form>
    </div>
  )
}

export default Otp
