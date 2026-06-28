# otp-auth

A small Cloudflare Worker (Hono) that emails a one-time passcode and verifies it.

## Endpoints

- `POST /otp/request` — body `{ "email": "you@example.com" }`. Generates a
  6-digit code, stores it in KV for 10 minutes, and emails it. Returns `{ "ok": true }`.
- `POST /otp/verify` — body `{ "email": "you@example.com", "code": "123456" }`.
  On success returns `{ "token": "<jwt>" }` (valid 7 days). On failure returns
  `401 { "error": "Invalid or expired code" }`.

## Local development

```bash
npm install
npm run dev        # starts wrangler dev on http://localhost:8787
```

In dev mode (`ENVIRONMENT=dev` in `.dev.vars`) the code is **printed to the
console** instead of emailed, so you can test without an inbox. Watch the
`wrangler dev` terminal for a line like `[dev] OTP for you@example.com: 123456`.

## Deploying (real email)

1. Create a KV namespace and paste its id into `wrangler.jsonc`:
   ```bash
   npx wrangler kv namespace create OTP_KV
   ```
2. In `wrangler.jsonc`, set `SENDER_EMAIL` to a **verified** sender in your
   Cloudflare Email Service account, and set `ALLOWED_ORIGIN` to your deployed
   frontend URL.
3. Set the JWT secret (used to sign tokens):
   ```bash
   npx wrangler secret put JWT_SECRET
   ```
4. Deploy:
   ```bash
   npm run deploy
   ```

## Frontend wiring

The frontend reads the API URL from `VITE_OTP_API_URL` (defaults to
`http://localhost:8787`). Set it to the deployed Worker URL in production.
