# Lifesafe — Changelog

This changelog summarizes major milestones and notable changes in the Lifesafe repository (development timeline: 2026-06-16 → 2026-07-28). Use these entries for slides, release notes, or a quick project history reference.

## Unreleased
- Ongoing: Polishing UI, AI Therapist streaming improvements, and authentication refinements.
- Added opt-in social mood check-ins with private journal separation, friend notifications, support requests, and editable suggested chat replies.

## 2026-07-28 — Streaming AI, authentication, and polishing
- Added streaming Therapist contact and backend AI support (backend/ai_support.py, routers/ai_support.py). Frontend streaming APIs and tests added.
- Replaced OTP login with password authentication; fixed existing account login flows and removed temporary Therapist UI badge.
- Profile picture sidebar, S3 uploads, and related UI polish merged across frontend and backend.

## 2026-07-27 — Password login
- Replaced OTP login with password authentication; added a PasswordLogin page and updated login routing and pages (frontend/src/pages/PasswordLogin.jsx, frontend/src/pages/Login.jsx, frontend/src/App.jsx).

## 2026-07-24 → 2026-07-25 — Journal & UX improvements
- Added daily journal check-in flow and editing support (backend routers + frontend entry pages).
- Polished friends/chat UI (scrolling, composer, friend search photos) and added unread alerts.

## 2026-07-20 — Realtime messaging foundation
- Implemented realtime messaging (API Gateway / WebSocket → Lambda-style handlers), added realtime handlers, templates, and setup scripts.
- Wired frontend messaging components (ChatWindow, MessageInput, FriendsList) to realtime APIs and added basic unread/friend sync.

## 2026-07-13 → 2026-07-12 — Account pages and friends UI
- Created account creation UI and navigation; improved protected-route handling.
- Implemented Friends page and messaging components (friend list, chat UI, quick messages, wellness panel).

## 2026-07-07 → 2026-07-06 — Journal persistence and Entry UI
- Wired the Entry/journal page to DynamoDB persistence; added backend routers for entries and auto-provision (create_table) on startup.
- Added emoji-based journaling entry UI and connected new-entry workflow.

## 2026-06-27 → 2026-06-30 — Routing & OTP login
- Added routing and ProtectedRoute auth gating; introduced OTP login flow (microservice) and cookie-based auth helpers.
- Documented login design and added implementation plans.

## 2026-06-23 → 2026-06-20 — Resources, styling, and sidebar
- Added the Resources page and adjusted global styling (color scheme updates, base index.css changes).
- Implemented app sidebar and navigation components.

## 2026-06-16 — Initial upload
- Initial frontend scaffold: React + Vite app shell, assets, and base styles.

---

Files & areas changed most frequently (good for slide bullets):
- Frontend: pages (Login, CreateAccount, Entry, FriendsPage, Calendar), components (ChatWindow, FriendsList, Sidebar, ProtectedLayout), and CSS files.
- Backend: routers (entries, users, accounts, ai_support, friends, messages, profile_pictures), realtime handlers, create_table/database bootstrap, main.py.
- Infra/ops: backend/realtime/template.yaml, backend/.env.example, create_table auto-provision logic.

Suggested slide-ready bullets (copy/paste):
- "Built a full‑stack mental‑health app: React + Vite frontend with FastAPI backend, realtime chat, and persistent journaling (DynamoDB + S3)."
- "Added secure account flows (OTP → password), profile picture uploads, and a streaming AI ‘Therapist’ for realtime conversational support with retrieval‑augmented architecture."
- "Serverless realtime (API Gateway → Lambda) and Infrastructure-as-Code enable scale and simple operations."

Next steps (optional):
- Commit this file to the repo (git add / commit). Suggested commit message: "Add CHANGELOG.md — project changelog". If you'd like, I can add the file and create the commit for you.
- Generate a concise one-slide release notes or speaker notes version formatted for PowerPoint.
- Create a short markdown release note per date with links to key commits/PRs.

---

If you want this committed now, say "commit changelog" and I will create a commit with the recommended trailer. If you want the changelog expanded with commit hashes per entry, say "include commits" and I will add them.
