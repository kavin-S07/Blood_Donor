<div align="center">

# 🩸 BloodConnect

### A real-time blood donation coordination platform connecting donors and hospitals

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-black?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![JWT](https://img.shields.io/badge/Auth-JWT-orange?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io/)

[Live App](https://blood-donor-dusky.vercel.app) · [API Health Check](https://blood-donor-l9h3.onrender.com/health) · [Report a Bug](#-support--feedback)

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [Blood Compatibility Matrix](#-blood-compatibility-matrix)
- [Donation Lifecycle](#-donation-lifecycle)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the Project Locally](#-running-the-project-locally)
- [Available Scripts](#-available-scripts)
- [API Reference](#-api-reference)
- [Authentication & Authorization Flow](#-authentication--authorization-flow)
- [Screenshots](#-screenshots)
- [Deployment](#-deployment)
- [Project Workflow](#-project-workflow)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Support & Feedback](#-support--feedback)

---

## 🩺 About

**BloodConnect** is a full-stack web application that bridges the gap between **blood donors**, **hospitals**, and a **platform administrator**, coordinating the entire donation lifecycle in real time. When a hospital urgently needs blood, BloodConnect identifies compatible, eligible donors, ranks them by **actual road distance and ETA** (via OSRM routing — not just straight-line distance), and notifies them instantly.

The platform now includes a full **admin approval workflow**: hospitals register and wait for admin sign-off before they can create requests, giving the platform a verification layer that didn't exist in earlier versions. Once a donor accepts a request, BloodConnect supports **live GPS tracking** over WebSockets — the donor's location streams to the hospital in real time, complete with turn-by-turn route progress, until arrival is automatically detected.

> Built as a production-style full-stack project with a layered backend architecture (routes → controllers → services → repositories), JWT access/refresh authentication, role-based access control (Donor / Hospital / Admin), Socket.IO for real-time features, and a custom dark-crimson design system built with Tailwind CSS.

---

## ✨ Key Features

### 🔴 For Donors
- **Smart matching** — see open blood requests that match your blood group and are within a compatible, eligible pool
- **One-tap accept/decline** on incoming requests, with an "active request" view for whichever one you've accepted
- **Live navigation** — once you accept a request, get an OSRM-powered route, distance/ETA, and turn-by-turn progress to the hospital
- **Real-time location sharing** — your live position streams to the hospital over Socket.IO while en route; arrival is detected automatically
- **Eligibility tracking** — automatic cooldown enforcement after donating (90 days for male donors, 120 days for female donors)
- **Donation history** — a permanent, auditable record of every completed donation
- **Real-time notifications** for new requests, acceptances, and donation confirmations
- **Profile management** with an interactive map-based location picker and an availability toggle

### 🏥 For Hospitals
- **Create blood requests** with blood group, units needed, location, and emergency level (low → critical)
- **Smart Nearest Donor Matching** — ranks compatible, eligible donors by real road distance/ETA (OSRM), not straight-line distance; results are cached and concurrency-limited to stay polite to the routing API
- **Live donor tracking** — watch an accepted donor's live location on a map as they travel to your facility, with a route progress card
- **Notify next nearest donor** — if a donor doesn't respond or is rejected, auto-notify the next best match
- **Accepted donor tracking** per request, with a full response/notification log
- **Mark donor as donated** → automatically updates inventory, donor eligibility, and notifies the donor
- **Reject a donor** at the point of donation (e.g. failed health screening) with a reason
- **Enhanced dashboard & analytics** — response times, travel times, donation times, and monthly donation stats, on top of active/completed/accepted request counts and total donors engaged
- **Filterable request & donor lists**
- **Full donation history** for compliance and audit

### 🛡️ For Admins
- **Hospital approval workflow** — every hospital signup lands in a pending queue; admins review, approve, or reject (with a reason) before the hospital can log in or create requests
- **Admin dashboard** with platform-wide statistics
- **User management** — view all users, activate/deactivate accounts, and perform an admin-assisted password reset for locked-out users
- **Hospital directory** — browse all hospitals by status (pending / approved / rejected)
- **Platform-wide monitoring** of all blood requests and the full donation history across every hospital
- A default admin account is auto-seeded on first server startup

### 🔐 Platform-wide
- JWT **access + refresh token** authentication with automatic silent renewal on the frontend
- **Role-based access control** (Donor / Hospital / Admin) enforced on every protected route
- **Real-time notifications** via Socket.IO, authenticated per-connection with the same JWT
- Secure password hashing (bcrypt), rate limiting, Helmet security headers, strict CORS allow-listing
- Interactive **Leaflet + OpenStreetMap** location picker (search via Nominatim) for donor and hospital addresses — no paid maps API required
- In-app password management: users change their own password from their profile; admins can reset a user's password if they're locked out
- Responsive, dark crimson–themed UI built with Tailwind CSS

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript, Tailwind CSS, React Router, Axios, Socket.IO Client |
| **Maps / Location** | React Leaflet + OpenStreetMap tiles, Nominatim geocoding (search & reverse geocode) |
| **Backend** | Node.js, Express.js (layered: routes → controllers → services → repositories) |
| **Real-time** | Socket.IO (JWT-authenticated WebSocket connections) |
| **Routing / Distance** | OSRM (Open Source Routing Machine) public API — real road distance & ETA, with an in-memory cache |
| **Database** | PostgreSQL (raw SQL via `pg`, no ORM) — hosted on Neon |
| **Auth** | JWT (access + refresh tokens), bcrypt password hashing |
| **Security** | Helmet, strict CORS allow-list, express-rate-limit, express-validator |
| **Deployment** | Backend → Render · Frontend → Vercel · DB → Neon (serverless Postgres) |

---

## 🏗 Architecture

```
┌──────────────────┐        HTTPS / REST         ┌────────────────────────┐
│   React + TS       │ ──────────────────────────▶ │   Express API            │
│  (Vercel)          │ ◀────────────────────────── │   (Render)                 │
│                    │       JWT Bearer Token        │                            │
│                    │ ◀───────────────────────────▶ │  Socket.IO (live tracking) │
└──────────────────┘        WebSocket (JWT)         │  Routes → Controllers      │
                                                      │      ↓                     │
                                                      │  Services (matching,       │
                                                      │  eligibility, notifications,│
                                                      │  OSRM routing)              │
                                                      │      ↓                     │
                                                      │  Repositories (raw SQL)     │
                                                      └──────────┬──────────────────┘
                                                                 │
                                                    ┌────────────┼─────────────┐
                                                    ▼                          ▼
                                        ┌──────────────────────┐   ┌───────────────────────┐
                                        │  PostgreSQL (Neon)    │   │  OSRM public API       │
                                        └──────────────────────┘   │  (router.project-osrm) │
                                                                    └───────────────────────┘
```

**Backend layers:**
- `routes/` → defines endpoints + middleware chains (auth, role, validation)
- `controllers/` → request/response handling
- `services/` → business logic (eligibility rules, blood compatibility, OSRM-based donor matching, notifications, live-tracking arrival detection)
- `repositories/` → raw SQL queries against PostgreSQL
- `middleware/` → authentication, role-based authorization, rate limiting, validation, logging, error handling
- `database/migrations/` → versioned schema migrations, auto-applied on startup via `database/migrate.js`
- A Socket.IO server (bootstrapped in `server.js`) authenticates connections with the same JWT and handles live donor-location broadcasting, room-based tracking (`request:<id>`), and automatic arrival detection

---

## 🗄 Database Schema

| Table | Purpose |
|---|---|
| `users` | Core account info (name, email, password hash, contact, role, active flag, location) |
| `donors` | Donor profile — blood group, age, gender, availability, eligibility window, donation count |
| `hospitals` | Approved hospital profile — name, license number, address, contact, location, verified flag |
| `pending_hospitals` | Hospital signups awaiting admin review — approved rows are promoted into `hospitals` |
| `blood_requests` | Requests raised by hospitals — blood group, units needed/received, emergency level, status, hospital & pickup coordinates |
| `request_responses` | A donor's response to a request — pending / accepted / rejected / donated, with rejection reason and donation timestamp |
| `donations` | Permanent donation records linked to a request and hospital |
| `donor_locations` | Legacy live-location snapshots per donor/request (early tracking implementation) |
| `live_locations` | Current live-tracking table — per user/request GPS position with speed, heading, and accuracy |
| `donation_tracking` | Timestamps and durations across the donation lifecycle (response time, travel time, donation time) per request/donor |
| `notification_logs` | Structured log of every notification sent (type, channel, sender/recipient) — powers hospital notification history |
| `monthly_donation_stats` | Per-hospital monthly rollups of requests, completions, donations, and units — powers analytics |
| `notifications` | In-app notification feed per user |

---

## 🩸 Blood Compatibility Matrix

The platform automatically computes which donors are compatible with a given request:

| Donor Group | Can Donate To |
|---|---|
| O− | O−, O+, A−, A+, B−, B+, AB−, AB+ *(universal donor)* |
| O+ | O+, A+, B+, AB+ |
| A− | A−, A+, AB−, AB+ |
| A+ | A+, AB+ |
| B− | B−, B+, AB−, AB+ |
| B+ | B+, AB+ |
| AB− | AB−, AB+ |
| AB+ | AB+ *(universal recipient)* |

---

## ♻️ Donation Lifecycle

```
Hospital creates request (with location)
        │
        ▼
Smart Nearest Donor Matching: compatible + eligible donors ranked by
OSRM road distance/ETA → notified (auto-notify next nearest on rejection)
        │
        ▼
Donor accepts ───────────────► Donor rejects
        │
        ▼
Donor starts live navigation (OSRM route) and shares live GPS location
over Socket.IO — hospital watches in real time on a tracking map
        │
        ▼
Donor arrival auto-detected → both parties notified
        │
        ▼
Donor visits hospital
        │
   ┌────┴─────┐
   ▼          ▼
Donated     Rejected at hospital
   │         (with reason, e.g. low hemoglobin)
   ▼
• Donation record created
• Request units_received incremented (auto-completes when target met)
• Donor marked ineligible:
    – 90-day cooldown (male donors)
    – 120-day cooldown (female donors)
• Donation timing (response/travel/donation time) recorded for analytics
• Both donor & hospital notified
```

---

## 📁 Project Structure

```
BloodConnect/
├── BackendCode/
│   ├── config/                 # DB, JWT, and Resend (unused/legacy) configuration
│   ├── controllers/             # admin, auth, dashboard, donor, donorMatching, hospital,
│   │                             # liveTracking, navigation, notification, profile
│   ├── services/                 # Business logic — auth, admin, donor, donorMatching,
│   │                             # bloodCompatibility, hospital, liveTracking,
│   │                             # locationTracking, navigation, notification, OSRM, adminSeeder
│   ├── repositories/              # Raw SQL — admin, bloodRequest, donation, donor,
│   │                             # hospital, liveLocation, notification, pendingHospital, user
│   ├── middleware/                 # Auth, role-based authorization, rate limiting, validation,
│   │                             # logging, error handling
│   ├── routes/                     # auth, admin, hospital, donor, donorNearest, profile,
│   │                             # notification, dashboard, requestNearest, navigation, liveTracking
│   ├── validators/                  # express-validator schemas
│   ├── utils/                        # Constants (blood compatibility), OTP generator,
│   │                             # token helpers, response formatting
│   ├── database/
│   │   ├── schema.sql                 # Base schema
│   │   ├── migrations/                # 001–009: donation lifecycle, admin module,
│   │   │                             # location system, donor/live tracking, analytics
│   │   └── migrate.js                 # Migration runner (auto-run on startup)
│   ├── app.js                          # Express app setup, route mounting
│   └── server.js                       # Entry point — DB check, migrations, admin seed,
│                                       # HTTP + Socket.IO server bootstrap
│
└── FrontendCode/
    ├── components/                     # LocationPicker (Leaflet map), LiveTrackingMap,
    │                                 # NavigationMap, NearestDonorsPanel, FilterPanel,
    │                                 # AnalyticsSection, NotificationPanel, Navbar, Layout, etc.
    ├── context/
    │   └── AuthContext.tsx              # Global auth/session state
    ├── pages/                           # Role-specific pages — Donor/Hospital/Admin
    │                                 # dashboards, blood request flows, navigation,
    │                                 # hospital approvals, user management, profile
    ├── services/                        # Typed Axios API clients (auth, donor, hospital,
    │                                 # admin, profile, notification, navigation, location, socket)
    ├── types/                           # Shared TypeScript types (auth, donor, hospital,
    │                                 # analytics, liveTracking)
    └── utils/                           # Token/local-storage helpers, validators
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- PostgreSQL (local instance, or a [Neon](https://neon.tech) project)
- npm

### 1. Clone & install

```bash
git clone <your-repo-url>
cd BloodConnect

# Backend
cd BackendCode
npm install

# Frontend
cd ../FrontendCode
npm install
```

### 2. Set up the database

```bash
psql -U postgres -d blood_donor -f BackendCode/database/schema.sql
```

> Migration files in `database/migrations/` (001 through 009 — donation lifecycle, admin module, location system, donor/live tracking, analytics) run **automatically** on server startup via `database/migrate.js` — no manual migration steps needed after the initial schema.

### 3. Configure environment variables

Create a `.env` file in `BackendCode/` and `FrontendCode/` — see [Environment Variables](#-environment-variables) below.

### 4. Run the apps

```bash
# Backend (http://localhost:5000)
cd BackendCode
npm run dev

# Frontend (http://localhost:3000)
cd FrontendCode
npm start
```

On first backend startup, a **default admin account** is automatically seeded (see [Environment Variables](#-environment-variables) note below for credentials).

---

## 🔑 Environment Variables

### Backend (`BackendCode/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default `5000`) |
| `DATABASE_URL` | Full Postgres connection string (preferred, e.g. for Neon) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Local Postgres credentials (used if `DATABASE_URL` is not set) |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `JWT_EXPIRES_IN` | Access token lifetime (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime (e.g. `7d`) |
| `FRONTEND_URL` | Allowed CORS / Socket.IO origin(s), comma-separated |

> 🔑 **Default admin account:** on first startup (if no admin exists yet), the server seeds one automatically — `admin@bloodconnect.com` / `Admin1234`. **Change this password immediately** after your first login in any real deployment.

> ℹ️ **Note on email/OTP:** the codebase still contains an OTP/email verification module (`routes/otpRoutes.js`, `routes/email.routes.js`, Resend integration) from an earlier iteration, but it is **no longer wired into the app** — signup requires no email verification, and password resets are handled entirely in-app (self-service change-password, or admin-assisted reset for locked-out users). `RESEND_API_KEY` / `RESEND_FROM` are not required to run the app.

### Frontend (`FrontendCode/.env`)

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Base URL of the backend REST API (e.g. `http://localhost:5000/api`) |

> The Socket.IO client derives its URL from `REACT_APP_API_URL` (stripping the trailing `/api`) — no separate socket URL variable is needed.
>
> Maps use OpenStreetMap tiles and the public Nominatim search API via Leaflet — **no maps API key is required**.

---

## ▶️ Running the Project Locally

```bash
# Terminal 1 — backend
cd BackendCode
npm run dev          # http://localhost:5000  |  health check: /health

# Terminal 2 — frontend
cd FrontendCode
npm start              # http://localhost:3000
```

---

## 📜 Available Scripts

### Backend (`BackendCode/package.json`)
| Script | Description |
|---|---|
| `npm start` | Run the API with plain `node` |
| `npm run dev` | Run with `nodemon` for auto-restart during development |

### Frontend
| Script | Description |
|---|---|
| `npm start` | Run the development server |
| `npm run build` | Create a production build |

---

## 📡 API Reference

Base URL: `/api`. All routes except `/auth/signup`, `/auth/login`, and `/auth/refresh-token` require `Authorization: Bearer <accessToken>`.

### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/signup` | Register — donors are created immediately; hospitals are queued in `pending_hospitals` for admin approval |
| `POST` | `/login` | Login, returns access + refresh tokens (blocked for pending/rejected hospitals and deactivated users) |
| `POST` | `/refresh-token` | Exchange a refresh token for a new access token |

### Admin — `/api/admin` *(admin only)*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard` | Platform-wide statistics |
| `GET` | `/hospitals` | All active (approved) hospitals |
| `GET` | `/hospitals/pending` | Hospitals awaiting approval |
| `GET` | `/hospitals/approved` | Approved hospital signups |
| `GET` | `/hospitals/rejected` | Rejected hospital signups |
| `GET` | `/hospitals/:id` | Hospital detail |
| `POST` | `/hospitals/:id/approve` | Approve a pending hospital — promotes it into `hospitals` |
| `POST` | `/hospitals/:id/reject` | Reject a pending hospital, with a reason |
| `GET` | `/users` | List all users |
| `PATCH` | `/users/:id/activate` | Reactivate a user |
| `PATCH` | `/users/:id/deactivate` | Deactivate a user |
| `POST` | `/users/:id/reset-password` | Admin-assisted password reset for a locked-out user |
| `GET` | `/blood-requests` | All blood requests platform-wide |
| `GET` | `/donations` | Full donation history platform-wide |

### Donor — `/api/donor` *(donor only, unless noted)*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/requests` | Matching open blood requests |
| `POST` | `/request/:id/accept` | Accept a blood request |
| `POST` | `/request/:id/reject` | Decline a blood request |
| `PUT` | `/availability` | Toggle donation availability |
| `GET` | `/history` | Donation history |
| `GET` | `/dashboard` | Donor dashboard stats |
| `GET` | `/active-request` | The donor's currently accepted (in-progress) request, if any |
| `GET` | `/nearest` | *(hospital only)* Nearest compatible donors, independent of a specific request |

### Hospital — `/api/hospital` *(hospital only)*
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/request` | Create a new blood request |
| `GET` | `/requests` | List hospital's requests |
| `GET` | `/request/:id` | Request details |
| `PUT` | `/request/:id` | Update a request |
| `DELETE` | `/request/:id` | Delete a request |
| `GET` | `/request/:id/accepted-donors` | Donors who accepted this request |
| `POST` | `/request/:id/response/:responseId/donated` | Mark a donor as having donated |
| `POST` | `/request/:id/response/:responseId/reject` | Reject a donor at the hospital, with a reason |
| `GET` | `/history` | Donation history |
| `GET` | `/dashboard` | Hospital dashboard stats |
| `GET` | `/dashboard/enhanced` | Enhanced dashboard with lifecycle timing breakdowns |
| `GET` | `/analytics` | Response/travel/donation time analytics + monthly stats |
| `GET` | `/requests/filter` | Filtered request list |
| `GET` | `/donors/filter` | Filtered donor list |
| `GET` | `/notifications` | Notification log for this hospital's requests |
| `POST` | `/request/:id/notify-next` | Auto-notify the next nearest eligible donor |
| `GET` | `/request/:id/nearest-donors` | Nearest compatible donors for this specific request |

### Smart Nearest Donor Matching — `/api/request` *(hospital only)*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/:id/nearest` | Ranked nearest compatible/eligible donors for a request (OSRM road distance) |
| `POST` | `/:id/notify` | Notify the matched donors for a request |

### Donor Navigation — `/api/request` *(donor only)*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/:id/route` | OSRM route (geometry, distance, ETA) from the donor to the hospital for an accepted request |

### Live Tracking — `/api/request` *(hospital only)*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/:id/live-location` | Donor's current live location for a request |
| `GET` | `/:id/tracking` | Tracking session details/history for a request |

### Profile — `/api/profile`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get current user's profile |
| `PUT` | `/` | Update profile |
| `PUT` | `/change-password` | Change password (requires current password) |
| `GET` | `/location` | Get saved location |
| `PUT` | `/location` | Update location (lat/lng/formatted address) |

### Dashboard — `/api/dashboard`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Role-aware dashboard summary for the current user |

### Notifications — `/api/notifications`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List notifications |
| `PUT` | `/:id/read` | Mark one as read |
| `PUT` | `/read-all` | Mark all as read |
| `DELETE` | `/:id` | Delete a notification |

### Real-Time Events (Socket.IO)
| Event (client → server) | Payload | Description |
|---|---|---|
| `track:start` | `{ requestId }` | Donor joins the tracking room for a request |
| `track:location` | `{ latitude, longitude }` | Legacy periodic donor location update |
| `location:update` | `{ latitude, longitude, heading, speed, accuracy }` | Full live-tracking location update; auto-detects arrival |
| `track:watch` | `{ requestId }` | Hospital joins a request's tracking room |
| `track:route` | `{ donorLat, donorLng, hospitalLat, hospitalLng }` | Request an OSRM route between two points |

| Event (server → client) | Payload | Description |
|---|---|---|
| `donor:location` | `{ donorId, latitude, longitude, updatedAt }` | Broadcast donor position to the hospital room |
| `location:receive` | `{ userId, latitude, longitude, heading, speed, accuracy, timestamp }` | Broadcast full live-tracking payload |
| `donor:arrived` | `{ userId, requestId, message }` | Emitted when arrival is auto-detected |
| `donor:route` | route object or `null` | Response to `track:route` |

### Health Check
```http
GET /health
```

---

## 🔐 Authentication & Authorization Flow

1. **Signup** — donors are created immediately in `users` + `donors`. Hospitals are inserted into `pending_hospitals` with `status = 'pending'` and **cannot log in** until an admin approves them.
2. **Login** — checks `pending_hospitals` first (returns a clear "pending approval" or "rejected: `<reason>`" message if applicable), then verifies credentials against `users`, blocking deactivated (`is_active = false`) accounts.
3. **Tokens** — on success, the API issues a short-lived **access token** (default 15 min) and a longer-lived **refresh token** (default 7 days), both JWTs signed with separate secrets.
4. **Token storage & refresh** — the frontend attaches the access token to every request via an Axios interceptor; on a `401`, a response interceptor automatically calls `/auth/refresh-token`, queues any concurrent requests until the new token arrives, and retries them — falling back to a redirect to `/login` if refresh also fails.
5. **Route protection**
   - **Frontend**: `<ProtectedRoute>` (optionally with a `role` prop) redirects unauthenticated or wrong-role users.
   - **Backend**: an `authenticate` middleware verifies the JWT on every protected route; a `role`/`authorizeRole` middleware then restricts access to `donor`, `hospital`, or `admin` as declared per route.
6. **Socket.IO auth** — the same access token is passed in the WebSocket handshake (`socket.handshake.auth.token`) and verified before a connection is accepted; the decoded user id/role gate which tracking rooms the socket can join.
7. **Password management** — users change their own password in-app (requires current password); if a user is locked out, an **admin can reset it directly** via `/api/admin/users/:id/reset-password`. There is no email-based forgot-password flow in the active codebase.
8. **Admin bootstrap** — a default admin account is seeded automatically on server startup if none exists yet (see [Environment Variables](#-environment-variables)).

---

## 🖼 Screenshots

> _Add screenshots or GIFs of the Donor Dashboard, Hospital Dashboard, Live Tracking Map, Nearest Donor Matching, and Admin Hospital Approvals page here._

| Donor Dashboard | Hospital Dashboard | Live Tracking |
|---|---|---|
| ![Donor Dashboard](./docs/screenshots/donor-dashboard.png) | ![Hospital Dashboard](./docs/screenshots/hospital-dashboard.png) | ![Live Tracking](./docs/screenshots/live-tracking.png) |

| Nearest Donor Matching | Admin Hospital Approvals | Create Blood Request |
|---|---|---|
| ![Nearest Donors](./docs/screenshots/nearest-donors.png) | ![Admin Approvals](./docs/screenshots/admin-approvals.png) | ![Create Request](./docs/screenshots/create-request.png) |

---

## ☁️ Deployment

| Service | Platform |
|---|---|
| **Frontend** | [Vercel](https://vercel.com) |
| **Backend** | [Render](https://render.com) |
| **Database** | [Neon](https://neon.tech) (serverless Postgres) |

The backend automatically, on every startup:
- Verifies the database connection
- Runs any pending SQL migrations (`database/migrate.js`)
- Seeds a default admin account if one doesn't exist yet
- Trusts Render's reverse proxy (`app.set('trust proxy', 1)`) for correct rate limiting and IP detection
- Boots the Socket.IO server alongside the HTTP server for live tracking

---

## 🔄 Project Workflow

```
Hospital signs up → pending_hospitals ("pending") → Admin reviews
        │                                                  │
        ▼                                              approve/reject
Donor signs up → account active immediately                │
        │                                                  ▼
        │                                     Hospital can now log in & create requests
        ▼                                                  │
Donor browses/receives matching requests ◀──────────────────┘
        │
        ▼
Donor accepts → Smart Matching notifies next-best donor if rejected
        │
        ▼
Donor navigates (OSRM route) + shares live location (Socket.IO)
        │
        ▼
Arrival auto-detected → hospital marks donated/rejected
        │
        ▼
Donation recorded → donor cooldown applied → analytics updated
```

---

## 🗺 Roadmap

- [ ] Geolocation-based donor matching radius configuration
- [ ] PWA support / native push notifications
- [ ] Donor leaderboard & badges
- [ ] Re-enable transactional email (OTP verification, request alerts) via Resend once reliable delivery is confirmed
- [ ] Hospital-side bulk donor outreach (broadcast to all eligible donors, not just top-N)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please keep the `routes → controllers → services → repositories` layering and the existing migration pattern (`database/migrations/NNN_description.sql`, additive/`IF NOT EXISTS`) in mind when contributing to those areas.

---

## 📄 License

This project currently has no explicit license file. Until one is added, all rights are reserved by the author — please reach out before reusing this code in another project.

---

## 🤝 Support & Feedback

Found a bug or have a feature request? Open an issue in this repository or reach out directly.

<div align="center">

Made with ❤️ to make blood donation faster, smarter, and more connected.

</div>
