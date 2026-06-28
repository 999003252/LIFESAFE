import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sign } from 'hono/jwt'
import { generateOtp, sendOtpEmail } from './email.js'

const OTP_TTL_SECONDS = 600 // codes expire after 10 minutes
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7 // session token valid for 7 days

const app = new Hono()

// Allow the frontend origin to call this API.
app.use('*', cors({
  origin: (origin, c) => c.env.ALLOWED_ORIGIN || '*',
  allowMethods: ['POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))

// Step 1: user submits their email -> generate a code, store it, email it.
app.post('/otp/request', async (c) => {
  const { email } = await c.req.json().catch(() => ({}))
  if (!email || !email.includes('@')) {
    return c.json({ error: 'A valid email is required' }, 400)
  }

  const code = generateOtp()
  await c.env.OTP_KV.put(`otp:${email}`, code, { expirationTtl: OTP_TTL_SECONDS })

  try {
    await sendOtpEmail(c.env, email, code)
  } catch (err) {
    return c.json({ error: err.message || 'Failed to send the code' }, 502)
  }

  return c.json({ ok: true })
})

// Step 2: user submits the code -> verify it, then return a signed token.
app.post('/otp/verify', async (c) => {
  const { email, code } = await c.req.json().catch(() => ({}))
  if (!email || !code) {
    return c.json({ error: 'Email and code are required' }, 400)
  }

  const stored = await c.env.OTP_KV.get(`otp:${email}`)
  if (!stored || stored !== String(code).trim()) {
    return c.json({ error: 'Invalid or expired code' }, 401)
  }

  await c.env.OTP_KV.delete(`otp:${email}`)

  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  const token = await sign({ sub: email, exp }, c.env.JWT_SECRET)
  return c.json({ token })
})

export default app
