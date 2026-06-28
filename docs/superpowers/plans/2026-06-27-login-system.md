# Login System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an OTP-style login gate to the `frontend` app: unauthenticated users are routed to `/login`, complete an email → OTP stub flow, and land on the protected calendar; any email and any OTP are accepted.

**Architecture:** Introduce `react-router-dom` routing. `main.jsx` wraps the app in `<BrowserRouter>`; `App.jsx` becomes a route table with `/login`, `/otp`, and a protected `/`. A native-cookie auth module (`auth.js`) backs a `<ProtectedRoute>` gate. The two screens reuse the merged `index.css` styling.

**Tech Stack:** React 19, Vite 8, react-router-dom v7, native `document.cookie`. No test framework exists; verification is `npm run lint`, `npm run build`, and defined manual browser checks.

## Global Constraints

- Work entirely inside `frontend/`. Run npm/git commands from `frontend/` (repo root is one level up).
- Do NOT add "Co-Authored-By" trailers or any AI/Claude reference in code, comments, or commit messages.
- Any non-empty email is accepted; any non-empty OTP is accepted. No real verification.
- Cookie name: `lifesafe_auth`, value = email, `path=/`, 7-day max-age.
- Reuse existing `index.css` classes (`login-container`, `login-form`, `input-wrapper`, `input-field`, `login-button`) wherever possible.
- Each task ends green: `npm run build` succeeds and `npm run lint` reports no new errors.

---

### Task 1: Install react-router-dom

**Files:**
- Modify: `frontend/package.json` (via npm)

**Interfaces:**
- Produces: `react-router-dom` v7 available for import in later tasks.

- [ ] **Step 1: Install the dependency**

```bash
cd frontend
npm install react-router-dom@^7
```

- [ ] **Step 2: Verify it resolves**

Run: `node -e "require.resolve('react-router-dom')" && echo OK`
Expected: prints `OK` (or check `node_modules/react-router-dom` exists).

- [ ] **Step 3: Verify build still works**

Run: `npm run build`
Expected: `✓ built` with no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add react-router-dom dependency"
```

---

### Task 2: Auth cookie module

**Files:**
- Create: `frontend/src/auth.js`

**Interfaces:**
- Produces: `getAuth(): string` (email or `""`), `setAuth(email: string): void`, `clearAuth(): void`.

- [ ] **Step 1: Write `src/auth.js`**

```js
const COOKIE_NAME = 'lifesafe_auth'
const MAX_AGE_DAYS = 7

export function getAuth() {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_NAME}=`))
  return match ? decodeURIComponent(match.split('=')[1]) : ''
}

export function setAuth(email) {
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(email)}; path=/; max-age=${maxAge}`
}

export function clearAuth() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
}
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: build succeeds; lint reports no errors for `src/auth.js`.

- [ ] **Step 3: Commit**

```bash
git add src/auth.js
git commit -m "Add cookie-based auth helpers"
```

---

### Task 3: Styling additions

**Files:**
- Modify: `frontend/src/index.css` (append at end of file)

**Interfaces:**
- Produces: CSS classes `brand-wordmark`, `form-subtitle`, `form-error`, `form-note`, `secondary-button`, `fine-print`, `logout-button` used by later tasks.

- [ ] **Step 1: Append these rules to the end of `src/index.css`**

```css
.login-container .brand-wordmark {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.login-container .form-subtitle {
  text-align: center;
  color: #6b7280;
  margin-top: -1.5rem;
  margin-bottom: 1.5rem;
}

.login-form .form-error {
  color: #c0392b;
  font-size: 0.875rem;
  margin-top: -1rem;
  margin-bottom: 0.5rem;
}

.login-form .form-note {
  color: #1e242d;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  text-align: center;
}

.login-form .secondary-button {
  width: 100%;
  height: 54px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1.125rem;
  color: #1e242d;
  background: #fff;
  border: 1px solid #1e242d;
  border-radius: 0.31rem;
  margin-top: 1rem;
  transition: 0.2s ease;
}

.login-form .secondary-button:hover {
  background: #f1eff9;
}

.login-container .fine-print {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 400;
}

.logout-button {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border: 1px solid #1e242d;
  border-radius: 0.31rem;
  background: #fff;
  font-weight: 500;
}

.logout-button:hover {
  background: #f1eff9;
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `✓ built`, CSS bundle size grows slightly.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "Add styles for OTP screens and logout button"
```

---

### Task 4: Simplify InputField

**Files:**
- Modify: `frontend/src/components/InputField.jsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `<InputField type icon placeholder value onChange />` — a controlled icon + input with no password/eye-toggle logic.

- [ ] **Step 1: Replace the full contents of `src/components/InputField.jsx`**

```jsx
const InputField = ({ type, placeholder, icon, value, onChange }) => {
  return (
    <div className="input-wrapper">
      <input
        type={type}
        placeholder={placeholder}
        className="input-field"
        value={value}
        onChange={onChange}
        required
      />
      <i className="material-symbols-rounded">{icon}</i>
    </div>
  )
}

export default InputField
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: build succeeds (App.jsx still imports InputField; it renders fine without the eye toggle). Lint clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/InputField.jsx
git commit -m "Simplify InputField to a controlled icon input"
```

---

### Task 5: SignIn page (/login)

**Files:**
- Create: `frontend/src/pages/Login.jsx`

**Interfaces:**
- Consumes: `InputField`, `useNavigate` from react-router-dom.
- Produces: default-exported `Login` route component. On submit with non-empty email, navigates to `/otp` with `{ state: { email } }`.

- [ ] **Step 1: Write `src/pages/Login.jsx`**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    navigate('/otp', { state: { email } })
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
        <button type="submit" className="login-button">Continue</button>
      </form>
      <p className="signup-text fine-print">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
      </p>
    </div>
  )
}

export default Login
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: build succeeds; new file lints clean (unused until Task 8 — that is fine, it is exported and self-contained).

- [ ] **Step 3: Commit**

```bash
git add src/pages/Login.jsx
git commit -m "Add SignIn page with email entry"
```

---

### Task 6: OTP page (/otp)

**Files:**
- Create: `frontend/src/pages/Otp.jsx`

**Interfaces:**
- Consumes: `InputField`; `setAuth` from `../auth`; `useLocation`, `useNavigate`, `Navigate` from react-router-dom.
- Produces: default-exported `Otp` route component. Reads `location.state.email`; if absent, redirects to `/login`. On Login with non-empty code, calls `setAuth(email)` and navigates to `/`.

- [ ] **Step 1: Write `src/pages/Otp.jsx`**

```jsx
import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import InputField from '../components/InputField'
import { setAuth } from '../auth'

const Otp = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)

  if (!email) {
    return <Navigate to="/login" replace />
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Please enter the code we sent you')
      return
    }
    setAuth(email)
    navigate('/', { replace: true })
  }

  const handleResend = () => {
    setResent(true)
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
        {resent && <p className="form-note">OTP resent</p>}
        <button type="submit" className="login-button">Login</button>
        <button type="button" className="secondary-button" onClick={handleResend}>Resend OTP</button>
      </form>
    </div>
  )
}

export default Otp
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: build succeeds; new file lints clean.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Otp.jsx
git commit -m "Add OTP entry page"
```

---

### Task 7: ProtectedRoute gate

**Files:**
- Create: `frontend/src/components/ProtectedRoute.jsx`

**Interfaces:**
- Consumes: `getAuth` from `../auth`; `Navigate` from react-router-dom.
- Produces: `<ProtectedRoute>{children}</ProtectedRoute>` — renders `children` if authed, else `<Navigate to="/login" replace />`.

- [ ] **Step 1: Write `src/components/ProtectedRoute.jsx`**

```jsx
import { Navigate } from 'react-router-dom'
import { getAuth } from '../auth'

const ProtectedRoute = ({ children }) => {
  if (!getAuth()) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default ProtectedRoute
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: build succeeds; new file lints clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/ProtectedRoute.jsx
git commit -m "Add ProtectedRoute auth gate"
```

---

### Task 8: Wire routing (cutover) + remove teammate leftovers

**Files:**
- Modify: `frontend/src/App.jsx` (replace full contents)
- Modify: `frontend/src/main.jsx` (replace full contents)
- Delete: `frontend/src/components/SocialLogin.jsx`, `frontend/src/assets/google.svg`, `frontend/src/assets/apple.svg`

**Interfaces:**
- Consumes: `Login`, `Otp`, `ProtectedRoute`, `CalendarPage`; `Routes`, `Route`, `BrowserRouter`.
- Produces: route table — `/login` → `Login`, `/otp` → `Otp`, `/` → `ProtectedRoute > CalendarPage`.

- [ ] **Step 1: Replace the full contents of `src/App.jsx`**

```jsx
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Otp from './pages/Otp'
import ProtectedRoute from './components/ProtectedRoute'
import CalendarPage from './components/CalendarPage'

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/otp" element={<Otp />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
```

- [ ] **Step 2: Replace the full contents of `src/main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 3: Delete the unused teammate files**

```bash
git rm src/components/SocialLogin.jsx src/assets/google.svg src/assets/apple.svg
```

- [ ] **Step 4: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: build succeeds; no unresolved imports (App.jsx no longer imports SocialLogin or the svgs).

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/main.jsx
git commit -m "Set up routing with protected calendar and OTP login"
```

---

### Task 9: Logout button on the calendar

**Files:**
- Modify: `frontend/src/components/CalendarPage.jsx`

**Interfaces:**
- Consumes: `useNavigate` from react-router-dom; `clearAuth` from `../auth`.
- Produces: a `Log out` button inside `.calendar-page` that clears the cookie and routes to `/login`.

- [ ] **Step 1: Add imports at the top of `src/components/CalendarPage.jsx`**

Add after the existing `import { useState } from 'react'` line:

```jsx
import { useNavigate } from 'react-router-dom'
import { clearAuth } from '../auth'
```

- [ ] **Step 2: Add the navigate hook and handler inside the component**

Add immediately after the `const [mood, setMood] = useState(3)` line:

```jsx
    const navigate = useNavigate()

    const handleLogout = () => {
        clearAuth()
        navigate('/login', { replace: true })
    }
```

- [ ] **Step 3: Render the button as the first child of the `.calendar-page` div**

Change the opening of the main return block from:

```jsx
    <div className="calendar-page">
        <div className="calendar">
```

to:

```jsx
    <div className="calendar-page">
        <button className="logout-button" onClick={handleLogout}>Log out</button>
        <div className="calendar">
```

- [ ] **Step 4: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: build succeeds; lint clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/CalendarPage.jsx
git commit -m "Add logout button to calendar"
```

---

### Task 10: Manual end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Walk the flow in the browser**

Confirm each:
1. Visit `http://localhost:5173/` with no cookie → redirected to `/login`.
2. Submit an empty email → inline "Please enter your email", no navigation.
3. Enter any email → **Continue** → `/otp` shows "We sent you a OTP".
4. Click **Resend OTP** → "OTP resent" note appears.
5. Submit an empty code → inline error. Enter any code → **Login** → lands on the calendar at `/`.
6. Refresh `/` → stays on the calendar (cookie persists).
7. Click **Log out** → returns to `/login`; visiting `/` again redirects to `/login`.
8. Visit `/otp` directly (no email state) → redirected to `/login`.

- [ ] **Step 3: Stop the server**

Press `Ctrl+C`.

---

## Post-Plan Cleanup (after all tasks pass)

- [ ] Delete the working docs: `rm -rf docs/superpowers` (specs + plans are working artifacts, not deliverables). Commit: `git commit -am "Remove working design docs"` if the directory was tracked.
