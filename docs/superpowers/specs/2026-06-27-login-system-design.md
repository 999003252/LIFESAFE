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
- No router installed. `App.jsx` renders `CalendarPage` directly.
- No auth/cookie code exists.

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
- `src/pages/Login.jsx` + `src/pages/Login.css` — SignIn screen.
- `src/pages/Otp.jsx` + `src/pages/Otp.css` — OTP screen.

**Edited:**

- `src/main.jsx` — add `<BrowserRouter>`.
- `src/App.jsx` — define routes.
- Calendar component — add a Logout button.

## Styling

Match the provided mockup:

- Centered `lifesafe` wordmark near the top.
- SignIn: "Create an account" heading, helper text, `email@domain.com` input,
  full-width black **Continue** button, fine-print Terms/Privacy line.
- OTP: "We sent you a OTP" / "Please check your email", code input, full-width
  black **Login** and **Resend OTP** buttons.

## Testing

- Manual: visit `/` unauthenticated → redirected to `/login`; complete the flow →
  lands on calendar; refresh stays authenticated; logout returns to `/login`.
- Direct `/otp` visit without state → redirected to `/login`.

## Out of Scope

- Real OTP generation, email sending, and verification.
- Backend integration / token storage beyond the stub cookie.
