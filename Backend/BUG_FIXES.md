# BloodConnect Admin Module — Bug Fix Report

## Files Changed & Why

---

### 🔴 BUG 1 — `routes/admin.routes.js`
**Wrong middleware import path (crashes on startup)**

```js
// ❌ BROKEN — file does not exist
const authorizeRole = require('../middleware/authorizeRole');

// ✅ FIXED — correct filename
const authorizeRole = require('../middleware/role.middleware');
```
Every admin route would throw `MODULE_NOT_FOUND` at startup.

---

### 🔴 BUG 2 — `server.js`
**Top-level `await` in a CommonJS module (crashes on startup)**

```js
// ❌ BROKEN — `await` at module top-level is only valid in ES Modules
const createDefaultAdmin = require('./services/adminSeeder');
await createDefaultAdmin();   // SyntaxError: await is only valid in async functions

// ✅ FIXED — wrapped in async IIFE
(async () => {
    await db.query('SELECT 1');
    await runMigrations();
    await createDefaultAdmin();   // ✅ safe
    server.listen(PORT, ...);
})();
```
The seeder was also placed _after_ the `.then()` chain that starts the server, so it was never actually called.

---

### 🔴 BUG 3 — `services/auth.service.js`
**`pendingHospitalRepo` used but never imported (crashes on every login attempt)**

```js
// ❌ BROKEN — pendingHospitalRepo used in login() with no import at top
const login = async (email, password) => {
    ...
    const pendingHospital = await pendingHospitalRepo.findByEmail(email);  // ReferenceError!
    ...
};

// ✅ FIXED — added import
const pendingHospitalRepo = require('../repositories/pendingHospital.repository');
```

---

### 🔴 BUG 4 — `app.js`
**Admin routes never registered (all /api/admin/* routes return 404)**

```js
// ❌ BROKEN — admin routes are never mounted
// ✅ FIXED — added:
const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);
```

---

### 🔴 BUG 5 — `database/schema.sql`
**Multiple missing columns and a missing table**

| Issue | Detail |
|---|---|
| `users.role` CHECK | Did not include `'admin'` — INSERT for admin account would fail with a constraint violation |
| `users.is_active` | Column referenced in admin controller but missing from schema |
| `users.updated_at` | Used in `user.repository.update()` but missing from schema |
| `hospitals.verified` | Set to `true` in `approveHospital()` but column didn't exist |
| `hospitals.updated_at` | Used in `hospital.repository.update()` but missing from schema |
| `pending_hospitals` | **Entire table was missing** — every hospital signup and admin approval would fail |

All fixed in `database/schema.sql` and a new migration `004_admin_module.sql` is provided for existing databases.

---

### 🔴 BUG 6 — `services/email.service.js`
**`sendHospitalApprovalEmail` and `sendHospitalRejectionEmail` missing**

Both functions were imported and called in `admin.controller.js` but did not exist in the email service — causing a `TypeError: sendHospitalApprovalEmail is not a function` crash on every approve/reject action.

```js
// ✅ FIXED — both functions implemented and exported
module.exports = {
    sendBloodRequestEmail,
    sendHospitalApprovalEmail,    // ← added
    sendHospitalRejectionEmail,   // ← added
};
```

---

### 🟡 BUG 7 — `controllers/auth.controller.js`
**Hospital-specific login errors swallowed by generic catch**

The `login()` controller only caught `'Invalid email or password'`. All other error messages from `auth.service.login()` (pending, rejected, deactivated) fell through to `next(err)` and returned a generic 500.

Fixed to explicitly handle and return 403 for each case.

---

### 🟡 BUG 8 — `validators/auth.validator.js`
**`resetPasswordValidator` was imported in `auth.routes.js` but never exported**

```js
// ❌ BROKEN — exported but missing from module.exports
// ✅ FIXED — added to module.exports
module.exports = {
    signupValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,   // ← added
    changePasswordValidator,
};
```
This caused a `TypeError` on every `POST /api/auth/reset-password` call.

---

### 🟡 BUG 9 — `controllers/admin.controller.js`
**`getAllHospitals`, `getHospitalById`, `getAllBloodRequests`, `getDonationHistory` referenced in routes but missing from controller**

These handlers were defined in `admin.repository.js` and wired up in routes but never implemented in the controller. Added all four.

---

### 🟡 BUG 10 — `services/auth.service.js`
**Hospital signup still wrote to `users` table**

The original `signup()` sent hospitals straight to `users` + `hospitals` tables with no pending state. Fixed so hospital signups go to `pending_hospitals` and return a `requiresApproval: true` flag.

---

## File Summary

| File | Status |
|---|---|
| `server.js` | 🔴 Fixed (top-level await) |
| `app.js` | 🔴 Fixed (missing admin route) |
| `routes/admin.routes.js` | 🔴 Fixed (wrong middleware path) |
| `services/auth.service.js` | 🔴 Fixed (missing import + hospital flow) |
| `services/email.service.js` | 🔴 Fixed (2 missing functions) |
| `database/schema.sql` | 🔴 Fixed (5 missing columns + missing table) |
| `database/migrations/004_admin_module.sql` | ✅ New (for existing DBs) |
| `controllers/auth.controller.js` | 🟡 Fixed (error handling) |
| `controllers/admin.controller.js` | 🟡 Fixed (4 missing handlers) |
| `validators/auth.validator.js` | 🟡 Fixed (missing export) |
| `repositories/hospital.repository.js` | 🟡 Fixed (verified field) |
| `services/adminSeeder.js` | 🟡 Improved (bcrypt rounds) |

---

## API Endpoints (Admin)

```
POST   /api/auth/login                    → Admin / Donor / Hospital login
POST   /api/auth/signup                   → Donor immediate | Hospital → pending

GET    /api/admin/dashboard               → Stats (admin only)
GET    /api/admin/hospitals               → All approved hospitals
GET    /api/admin/hospitals/pending       → Pending approvals
GET    /api/admin/hospitals/approved      → Approved list
GET    /api/admin/hospitals/rejected      → Rejected list
GET    /api/admin/hospitals/:id           → Single hospital detail
POST   /api/admin/hospitals/:id/approve  → Approve hospital
POST   /api/admin/hospitals/:id/reject   → Reject hospital (body: { reason })
GET    /api/admin/users                   → All users
PATCH  /api/admin/users/:id/activate     → Activate user
PATCH  /api/admin/users/:id/deactivate   → Deactivate user
GET    /api/admin/blood-requests          → All blood requests
GET    /api/admin/donations               → All donations
```

## Default Admin Credentials
```
Email:    admin@bloodconnect.com
Password: Admin1234
```
