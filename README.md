<div align="center">

# 🩸 BloodConnect

### A real-time blood donation coordination platform connecting donors and hospitals

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-orange?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io/)

[Live App](https://blood-donor-dusky.vercel.app) · [API Health Check](https://blood-donor-l9h3.onrender.com/health) · [Report a Bug](#-support--feedback)

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [Blood Compatibility Matrix](#-blood-compatibility-matrix)
- [Donation Lifecycle](#-donation-lifecycle)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Support & Feedback](#-support--feedback)

---

## 🩺 About

**BloodConnect** is a full-stack web application that bridges the gap between **blood donors** and **hospitals** in real time. When a hospital urgently needs blood, BloodConnect instantly identifies and notifies all eligible, compatible donors nearby — turning a manual, phone-call-driven process into a streamlined digital workflow.

The platform manages the **entire donation lifecycle**: from a hospital raising a request, to a donor accepting it, to the hospital confirming the donation, updating donor eligibility, and recording it permanently in each user's history.

> Built as a production-style full-stack project with a layered backend architecture (controllers → services → repositories), JWT-based authentication, role-based access control, and a custom dark-crimson design system.

---

## ✨ Features

### 🔴 For Donors
- **Smart matching** — automatically see blood requests that match your blood group and location
- **One-tap accept/decline** on incoming requests
- **Eligibility tracking** — automatic cooldown enforcement after donating (90 days for men, 120 days for women)
- **Donation history** — a permanent, auditable record of every donation
- **Real-time notifications** for new requests, acceptances, and donation confirmations
- **Profile management** with availability toggle

### 🏥 For Hospitals
- **Create blood requests** with blood group, units needed, location, and emergency level (low → critical)
- **Automatic donor matching** — finds all compatible, eligible donors and notifies them instantly
- **Accepted donor tracking** per request
- **Mark donor as donated** → automatically updates inventory, donor eligibility, and notifies the donor
- **Reject a donor** at the point of donation (e.g. failed health screening) with a reason
- **Hospital dashboard** — active/completed/accepted requests, total units collected, total donors engaged
- **Full donation history** for compliance and audit

### 🔐 Platform-wide
- JWT **access + refresh token** authentication with automatic silent renewal
- **Role-based access control** (Donor / Hospital)
- Secure password hashing (bcrypt), rate limiting, Helmet security headers
- Forgot/reset password flow
- Responsive, dark crimson–themed UI built with Tailwind CSS

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript, Vite, Tailwind CSS, React Router, Axios |
| **Backend** | Node.js, Express.js (layered MVC: controllers → services → repositories) |
| **Database** | PostgreSQL (raw SQL via `pg`, no ORM) — hosted on Neon |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **Security** | Helmet, CORS, express-rate-limit, express-validator |
| **Deployment** | Backend → Render · Frontend → Vercel · DB → Neon (serverless Postgres) |

---

## 🏗 Architecture

```
┌─────────────────┐        HTTPS / REST        ┌──────────────────────┐
│   React + TS     │ ───────────────────────▶  │   Express API         │
│  (Vercel)        │ ◀───────────────────────  │   (Render)             │
│                  │      JWT Bearer Token       │                        │
└─────────────────┘                             │  Controllers           │
                                                 │      ↓                 │
                                                 │  Services (business    │
                                                 │  logic, notifications,  │
                                                 │  blood compatibility)   │
                                                 │      ↓                 │
                                                 │  Repositories (raw SQL) │
                                                 └──────────┬─────────────┘
                                                            │
                                                            ▼
                                                 ┌──────────────────────┐
                                                 │  PostgreSQL (Neon)    │
                                                 └──────────────────────┘
```

**Backend layers:**
- `routes/` → defines endpoints + middleware chains
- `controllers/` → request/response handling
- `services/` → business logic (eligibility rules, blood matching, notifications)
- `repositories/` → raw SQL queries against PostgreSQL
- `middleware/` → auth, rate limiting, validation, logging, error handling
- `database/migrations/` → versioned schema migrations, auto-applied on startup via `database/migrate.js`

---

## 🗄 Database Schema

| Table | Purpose |
|---|---|
| `users` | Core account info (name, email, password hash, contact, role) |
| `donors` | Donor profile — blood group, age, gender, availability, eligibility window |
| `hospitals` | Hospital profile — name, license number, address, contact |
| `blood_requests` | Requests raised by hospitals — blood group, units needed/received, emergency level, status |
| `request_responses` | A donor's response to a request — accepted / rejected / donated, with rejection reason |
| `donations` | Permanent donation records linked to a request and hospital |
| `notifications` | In-app notification feed per user |
| `schema_migrations` | Tracks which migration files have been applied |

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
Hospital creates request
        │
        ▼
Compatible & eligible donors notified
        │
        ▼
Donor accepts ───────────────► Donor rejects
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
• Both donor & hospital notified
```

---

## 📁 Project Structure

```
BloodConnect/
├── BackendCode/
│   ├── config/             # DB & JWT configuration
│   ├── controllers/         # Request handlers
│   ├── services/            # Business logic
│   ├── repositories/        # SQL queries
│   ├── middleware/           # Auth, validation, rate limiting, logging
│   ├── routes/               # API route definitions
│   ├── validators/           # express-validator schemas
│   ├── utils/                 # Constants, token helpers, response formatting
│   ├── database/
│   │   ├── schema.sql         # Base schema
│   │   ├── migrations/        # Versioned migrations (auto-applied on startup)
│   │   └── migrate.js         # Migration runner
│   ├── app.js                 # Express app setup
│   └── server.js              # Entry point
│
└── FrontendCode/
    └── src/
        ├── pages/             # Route-level pages (Dashboard, Requests, Profile, etc.)
        ├── services/          # API clients (axios)
        ├── utils/             # Token storage helpers
        └── types/             # Shared TypeScript types
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

> Migration files in `database/migrations/` run **automatically** on server startup — no manual migration steps needed after the initial schema.

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

---

## 🔑 Environment Variables

### Backend (`BackendCode/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default `5000`) |
| `DATABASE_URL` | Full Postgres connection string (preferred for Neon) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Local Postgres credentials (used if `DATABASE_URL` not set) |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `JWT_EXPIRES_IN` | Access token lifetime (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime (e.g. `7d`) |
| `FRONTEND_URL` | Allowed CORS origin(s), comma-separated |
| `EMAIL_USER` / `EMAIL_PASS` | SMTP credentials *(currently unused — see note below)* |

> ℹ️ **Note on email:** Password reset OTPs are currently logged to the server console (`[Password Reset OTP] email -> otp`) rather than emailed, since SMTP is unreliable on free hosting tiers. Signup no longer requires email verification.

### Frontend (`FrontendCode/.env`)

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Base URL of the backend API (e.g. `http://localhost:5000/api`) |

---

## 📡 API Reference

Base URL: `/api`

### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/signup` | Create a donor or hospital account |
| `POST` | `/login` | Login, returns access + refresh tokens |
| `POST` | `/refresh-token` | Get a new access token |
| `POST` | `/forgot-password` | Request a password reset OTP |
| `POST` | `/verify-otp` | Verify a reset OTP |
| `POST` | `/reset-password` | Reset password using OTP |

### Donor — `/api/donor`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard` | Donor dashboard stats |
| `GET` | `/requests` | Matching open blood requests |
| `POST` | `/request/:id/accept` | Accept a blood request |
| `POST` | `/request/:id/reject` | Decline a blood request |
| `PUT` | `/availability` | Toggle donation availability |
| `GET` | `/history` | Donation history |

### Hospital — `/api/hospital`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard` | Hospital dashboard stats |
| `POST` | `/request` | Create a new blood request |
| `GET` | `/requests` | List hospital's requests |
| `GET` | `/request/:id` | Request details |
| `PUT` | `/request/:id` | Update a request |
| `DELETE` | `/request/:id` | Delete a request |
| `GET` | `/request/:id/accepted-donors` | Donors who accepted this request |
| `POST` | `/request/:id/response/:responseId/donated` | Mark a donor as having donated |
| `POST` | `/request/:id/response/:responseId/reject` | Reject a donor at the hospital |
| `GET` | `/history` | Donation history |

### Profile — `/api/profile`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get current user's profile |
| `PUT` | `/` | Update profile |
| `PUT` | `/change-password` | Change password |

### Notifications — `/api/notifications`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List notifications |
| `PUT` | `/:id/read` | Mark one as read |
| `PUT` | `/read-all` | Mark all as read |
| `DELETE` | `/:id` | Delete a notification |

> All routes except `/auth/*` require `Authorization: Bearer <accessToken>`.

---

## ☁️ Deployment

| Service | Platform |
|---|---|
| **Frontend** | [Vercel](https://vercel.com) |
| **Backend** | [Render](https://render.com) |
| **Database** | [Neon](https://neon.tech) (serverless Postgres) |

The backend automatically:
- Runs pending SQL migrations on every startup (`database/migrate.js`)
- Trusts Render's reverse proxy (`app.set('trust proxy', 1)`) for correct rate limiting

---

## 🗺 Roadmap

- [ ] Email/SMS delivery via a transactional API (Resend/Brevo) for OTPs and request alerts
- [ ] Geolocation-based donor matching radius
- [ ] Admin panel for hospital verification
- [ ] PWA support / push notifications
- [ ] Donor leaderboard & badges

---

## 🤝 Support & Feedback

Found a bug or have a feature request? Open an issue in this repository or reach out directly.

<div align="center">

Made with ❤️ to make blood donation faster, smarter, and more connected.

</div>
