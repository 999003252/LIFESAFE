// Calls to the otp-auth microservice.
const BASE = import.meta.env.VITE_OTP_API_URL || 'http://localhost:8787'

export async function requestOtp(email) {
  const res = await fetch(`${BASE}/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Could not send the code')
  }
  return res.json()
}

export async function verifyOtp(email, code) {
  const res = await fetch(`${BASE}/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Invalid or expired code')
  }
  return data.token
}
