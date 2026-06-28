# Login System Design

**Date:** 2026-06-27
**Branch:** `9-setup-proper-app-routing`

## Goal

Add an OTP-style login gate to the `frontend` React app. Users without an auth
cookie are redirected to `/login`. For now the system is a stub: **any** email is
accepted and **any** OTP code is accepted. This work also introduces proper app
routing (the branch's purpose), since the gate requires real routes.

## Current State

- React 19 + Vite app in `frontend/`.
- PR #10 (teammate's login UI) has been **merged** into this branch. It added a
  password/social "Log in with" screen in `App.jsx`, plus `SocialLogin.jsx`,
  `InputField.jsx`, `google.svg`, `apple.svg`, and login styling in `index.css`.
- This redesign replaces that screen with an **OTP-only** flow, reusing the merged
  `index.css` styling and a simplified `InputField`.
- No router installed yet. No auth/cookie code exists.

## Architecture

### Routing (react-router-dom v7)

- Install `react-router-dom`.
- `main.jsx` wraps `<App/>` in `<BrowserRouter>`.
- `App.jsx` defines the route table:
  - `/login` → `SignIn` page (email entry)
  - `/otp` → `Otp` page (code entry)
  - `/` → protected route rendering the existing calendar app
- `<ProtectedRoute>` wraps protected elements: if `getAuth()` is empty,
  render `<Navigate to="/login" replace/>`; otherwise render the children.

### Auth / cookie (`src/auth.js`)

Native `document.cookie` helpers (no extra dependency):

- `getAuth()` → returns the logged-in email string, or `""` if no cookie.
- `setAuth(email)` → writes cookie `lifesafe_auth=<email>`, `path=/`, ~7-day expiry.
- `clearAuth()` → expires the cookie.

Cookie name: `lifesafe_auth`. Value: the user's email.

## Flow

1. Visit `/` with no cookie → `ProtectedRoute` redirects to `/login`.
2. **SignIn** (`/login`): user enters an email. Validation: non-empty only (any
   email allowed). **Continue** navigates to `/otp`, carrying the email via
   router location state.
3. **OTP** (`/otp`): shows "We sent you a OTP". User enters any code. **Login**
   accepts anything non-empty, calls `setAuth(email)`, navigates to `/`.
   **Resend OTP** is a no-op stub that shows a brief "OTP resent" note.
4. `/` renders the calendar app with a **Logout** button that calls `clearAuth()`
   and navigates to `/login`.

### Edge cases

- Direct visit to `/otp` without an email in router state → redirect to `/login`.
- Empty email on SignIn / empty code on OTP → inline validation message, no navigation.

## Components & Files

**New:**

- `src/auth.js` — cookie helpers.
- `src/components/ProtectedRoute.jsx` — auth gate wrapper.
- `src/pages/Login.jsx` — SignIn (email entry) screen.
- `src/pages/Otp.jsx` — OTP (code entry) screen.

**Edited:**

- `src/main.jsx` — add `<BrowserRouter>`.
- `src/App.jsx` — replace the teammate's login layout with the route table.
- `src/components/InputField.jsx` — simplify: drop the password/eye-toggle branch;
  keep a plain icon + text input, reused for both email and OTP entry.
- Calendar component — add a Logout button.
- `index.css` — append a small `.brand-wordmark` / subtitle rule and a
  `.secondary-button` (outlined) variant for "Resend OTP"; reuse existing classes.

**Deleted (teammate leftovers not used by OTP flow):**

- `src/components/SocialLogin.jsx`
- `src/assets/google.svg`, `src/assets/apple.svg`

## Styling

Reuse the merged `index.css` look (dark `#1e242d` theme, white `.login-container`
card, `.input-wrapper`/`.input-field` with left icon, full-width dark
`.login-button`). Both pages render inside `.login-container`.

- `lifesafe` wordmark at the top of each card (new `.brand-wordmark` class).
- SignIn: wordmark, "Create an account" heading (`.form-title`), helper text,
  email `InputField` (mail icon) inside `.login-form`, full-width `.login-button`
  labeled **Continue**, fine-print Terms/Privacy line.
- OTP: wordmark, "We sent you a OTP" / "Please check your email", OTP `InputField`,
  full-width `.login-button` labeled **Login**, plus a `.secondary-button`
  **Resend OTP**.

## Testing

- Manual: visit `/` unauthenticated → redirected to `/login`; complete the flow →
  lands on calendar; refresh stays authenticated; logout returns to `/login`.
- Direct `/otp` visit without state → redirected to `/login`.

## Out of Scope

- Real OTP generation, email sending, and verification.
- Backend integration / token storage beyond the stub cookie.
