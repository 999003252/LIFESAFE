// Generates the OTP code and sends it to the user's email.

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function sendOtpEmail(env, email, code) {
  // In local development we don't send a real email — we just log the code
  // so the team can test the flow without setting up inboxes.
  if (env.ENVIRONMENT === 'dev') {
    console.log(`[dev] OTP for ${email}: ${code}`)
    return
  }

  await env.EMAIL.send({
    to: email,
    from: env.SENDER_EMAIL,
    subject: 'Your lifesafe verification code',
    text: `Your lifesafe verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your lifesafe verification code is <strong>${code}</strong>.</p>
<p>It expires in 10 minutes.</p>`,
  })
}
