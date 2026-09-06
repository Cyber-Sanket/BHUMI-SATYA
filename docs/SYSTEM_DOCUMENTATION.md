# BHUMI-SATYA: System, Authentication & Production Deployment Documentation

---

## 1. System Overview & Architecture

**BHUMI-SATYA** is an interoperable, mathematically backed evidence & decision-support layer designed to bind statutory land acquisition milestones to cryptographically signed, multi-signal geographically verified field evidence.

### 1.1 Infrastructure Topology

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT / BROWSER TIER                                 │
│                                                                                 │
│   Web Frontend (React 18 + Vite + Tailwind CSS + MapLibre GL)                   │
│   Hosted on Netlify: https://bhumi-satya.netlify.app                            │
│   Mobile Field App (Flutter / Android)                                          │
└───────────────────────┬─────────────────────────────────┬───────────────────────┘
                        │ Relative API Calls              │ Direct Cross-Origin
                        │ /api/* (Proxied)                │ VITE_API_URL (CORS Allowed)
                        ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        EDGE / ROUTING LAYER (Netlify)                           │
│                                                                                 │
│   - SPA Routing: /* -> /index.html (Status 200)                                 │
│   - Reverse Proxy: /api/* -> Railway Backend (Status 200, Force)                │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼ HTTPS
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION SERVER TIER (Railway)                          │
│                                                                                 │
│   FastAPI Backend (Python 3.11+ / Uvicorn)                                      │
│   Hosted on Railway: https://bhumi-satya-production.up.railway.app              │
│                                                                                 │
│   Core Modules:                                                                 │
│   ├── Auth & RBAC (/api/v1/auth)                                                │
│   ├── GIS Engine (/api/v1/parcels, /api/v1/projects)                           │
│   ├── Evidence & Verdict Evaluation (/api/v1/evidence)                          │
│   ├── Alerts & Audit System (/api/v1/alerts, /api/v1/audit-logs)                │
│   └── Landowner Transparency Portal (/api/v1/landowner)                         │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE STORAGE TIER                                 │
│                                                                                 │
│   PostgreSQL 16 + PostGIS 3.4 Spatial Extension                                 │
│   Hosted on Supabase / Cloud Managed PostgreSQL                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Authorization Architecture

### 2.1 Credential Specifications & Preset Accounts

The system supports strict Role-Based Access Control (RBAC) with pre-seeded demonstration accounts:

| Role | Username / Official Email | Default Password | Granted Privileges |
| :--- | :--- | :--- | :--- |
| **Admin Officer** | `admin@bhumisatya.gov.in` | `AdminPass123!` | Full system administration, project creation, alert clearance, verdict overrides, audit log inspection. |
| **Field Surveyor** | `field1@bhumisatya.gov.in` | `FieldPass123!` | Evidence submission, photo capture, GPS attestation, parcel view. |

### 2.2 JWT Token Lifecycle & Cryptographic Specifications

- **Token Type**: Bearer JSON Web Token (JWT)
- **Algorithm**: `HS256` (HMAC SHA-256)
- **Secret Key**: Set via production environment variable `SECRET_KEY` (minimum 32 cryptographically secure characters)
- **Expiration Policy**: 7 Days (`60 * 24 * 7 = 10,080 minutes`)
- **Token Payload Schema**:
  ```json
  {
    "sub": "admin@bhumisatya.gov.in",
    "role": "admin",
    "id": "e84f6c48-2a1c-4b68-b990-1c0bcf14896e",
    "exp": 1788771480
  }
  ```

### 2.3 API Endpoint Contract

#### A. User Login (`POST /api/v1/auth/login`)
- **Content-Type**: `application/x-www-form-urlencoded` (OAuth2 Password flow standard)
- **Request Body**:
  - `username`: string (user email)
  - `password`: string
- **Success Response (`200 OK`)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
  }
  ```
- **Error Response (`401 Unauthorized`)**:
  ```json
  {
    "detail": "Incorrect email or password"
  }
  ```

#### B. Current User Profile (`GET /api/v1/auth/me`)
- **Headers**: `Authorization: Bearer <access_token>`
- **Success Response (`200 OK`)**:
  ```json
  {
    "id": "e84f6c48-2a1c-4b68-b990-1c0bcf14896e",
    "email": "admin@bhumisatya.gov.in",
    "full_name": "Sanket Aher (Administrator)",
    "role": "admin",
    "is_active": true,
    "created_at": "2026-09-05T08:30:00Z"
  }
  ```
- **Error Response (`401 Unauthorized`)**:
  ```json
  {
    "detail": "Could not validate credentials"
  }
  ```

---

## 3. Frontend Authentication Engine & Flow

### 3.1 State Machine Architecture (`AuthContext.jsx`)

The frontend manages authentication state centrally through `AuthContext.jsx`:

- **State Variables**:
  - `user`: Stores decoded user profile object (or `null` when logged out).
  - `token`: Stores JWT string retrieved from `localStorage.getItem('token')`.
  - `loading`: Boolean indicating whether session validation is currently underway.
    - Initialized synchronously: `() => Boolean(localStorage.getItem('token'))` (never blocks unauthenticated first-time visitors).
  - `error`: Stores human-readable authentication error strings.
  - `isAuthenticated`: Derived boolean: `Boolean(token && user)`.

### 3.2 Sequence Diagram: Complete Login & Navigation Flow

```
User               Login.jsx              AuthContext.jsx            apiService (Axios)        FastAPI Backend
 │                     │                         │                           │                         │
 ├─ Submits Form ─────►│                         │                           │                         │
 │                     ├─ setSubmitting(true)    │                           │                         │
 │                     ├─ setFormError('')       │                           │                         │
 │                     ├─ Calls login(email,pw) ─►                         │                         │
 │                     │                         ├─ setLoading(true)         │                         │
 │                     │                         ├─ Calls apiService.login ─►│                         │
 │                     │                         │                           ├─ POST /auth/login ─────►│
 │                     │                         │                           │◄─ 200 {access_token} ───┤
 │                     │                         ├─ Store in localStorage    │                         │
 │                     │                         ├─ setToken(access_token)   │                         │
 │                     │                         ├─ Calls apiService.getMe ─►│                         │
 │                     │                         │                           ├─ GET /auth/me (Bearer) ─►
 │                     │                         │                           │◄─ 200 {user profile} ───┤
 │                     │                         ├─ setUser(userData)        │                         │
 │                     │                         ├─ setError(null)           │                         │
 │                     │                         ├─ finally: setLoading(false)                         │
 │                     │◄─ Returns userData ─────┤                           │                         │
 │                     ├─ navigate(targetPath)   │                           │                         │
 │                     │  (defaults to '/')      │                           │                         │
 │                     ▼                         │                           │                         │
 │            ProtectedRoute.jsx                 │                           │                         │
 │                     │                         │                           │                         │
 │                     ├─ checks !loading &      │                           │                         │
 │                     │  isAuthenticated=true   │                           │                         │
 │                     ├─ Renders Dashboard      │                           │                         │
 │◄────────────────────┴─────────────────────────┴───────────────────────────┴─────────────────────────┘
```

### 3.3 Route Protection (`ProtectedRoute.jsx`)

1. **Loading State Barrier**:
   - If `loading === true`, renders the workstation security spinner (`AUTHENTICATING WORKSTATION SESSION...`).
   - Prevents premature evaluation and stops race conditions from redirecting valid users to `/login`.
2. **Sanitized Redirection**:
   - If `!isAuthenticated`, redirects to `/login`.
   - Sanitizes the return location (`location.pathname !== '/login' ? location : { pathname: '/' }`) so that a user already on `/login` will never create a circular redirect back to `/login`.

---

## 4. Production Root Cause Analyses & Resolution

### 4.1 Bug 1: Premature ProtectedRoute Bounce & Loading Loop
- **Symptom**: Login succeeded on the backend, but the frontend remained stuck on `/login` or rapidly flickered.
- **Root Cause**: `login()` in `AuthContext` did not toggle `loading = true` or `finally: loading = false`. `Login.jsx` immediately triggered `navigate(targetPath)`. `ProtectedRoute` mounted before `user` had updated, saw `isAuthenticated = false`, and immediately threw the user back to `/login`.
- **Fix**: Wrapped `login()` with `setLoading(true)` and guaranteed `finally { setLoading(false); }`. Synchronously initialized `loading` to token presence.

### 4.2 Bug 2: Circular Target Redirection Loop
- **Symptom**: After successful login, the application navigated to `/login` again.
- **Root Cause**: `ProtectedRoute` set `state: { from: location }`. If the user was on `/login`, `from` was `/login`. Upon login, `Login.jsx` redirected to `from` (`/login`), triggering an infinite `useEffect` loop.
- **Fix**: Added target path sanitization in `Login.jsx`:
  ```javascript
  const rawFrom = location.state?.from;
  const fromPath = typeof rawFrom === 'string' ? rawFrom : rawFrom?.pathname;
  const targetPath = (fromPath && fromPath !== '/login') ? fromPath : '/';
  ```

### 4.3 Bug 3: Duplicate Token Storage
- **Symptom**: Race conditions between axios storage and React state synchronization.
- **Root Cause**: Both `apiService.login` and `AuthContext.login` independently invoked `localStorage.setItem('token', ...)`.
- **Fix**: Centralized storage strictly inside `AuthContext.jsx`.

### 4.4 Bug 4: Axios 401 Interceptor Loop
- **Symptom**: Entering an incorrect password purged existing session tokens and broke error recovery.
- **Root Cause**: The response interceptor unconditionally fired `window.dispatchEvent(new Event('auth-unauthorized'))` on any 401 status, even for login failures.
- **Fix**: Filtered out `/auth/login` requests from triggering the unauthorized event:
  ```javascript
  if (error.response && error.response.status === 401) {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (!isLoginRequest) {
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
  }
  ```

### 4.5 Bug 5: CORS Preflight Failure ("Network Error")
- **Symptom**: In the deployed Netlify environment, clicking "Sign In" immediately produced a red `Network Error` banner.
- **Root Cause**: Railway FastAPI backend had `ALLOWED_ORIGINS` configured strictly for `http://localhost:5173`. When `https://bhumi-satya.netlify.app` sent the browser's preflight `OPTIONS` request, Railway returned `HTTP 400 Disallowed CORS origin`. Modern browsers abort requests on preflight errors, prompting Axios to throw a generic `Network Error`.
- **Fix**:
  1. Updated `backend/app/main.py` CORS middleware:
     - Appended `https://bhumi-satya.netlify.app`, `http://localhost:5173`, and `http://localhost:3000` to `allow_origins`.
     - Added regex `allow_origin_regex=r"https://.*\.netlify\.app"` to automatically accept preview and production Netlify URLs.
  2. Updated `netlify.toml` with a server-side reverse proxy redirect:
     ```toml
     [[redirects]]
       from = "/api/*"
       to = "https://bhumi-satya-production.up.railway.app/api/:splat"
       status = 200
       force = true
     ```

---

## 5. Deployment & Configuration Matrix

### 5.1 Environment Variables

#### Backend (Railway Environment Variables)
| Variable | Description | Recommended Production Value |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Operational environment flag | `production` |
| `SECRET_KEY` | JWT signing secret (min 32 chars) | Secure random hexadecimal string |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://[user]:[password]@[host]:[port]/[db]` |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed domains | `https://bhumi-satya.netlify.app,http://localhost:5173,http://localhost:3000` |

#### Frontend (Netlify Environment Variables)
| Variable | Description | Production Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend base URL | `https://bhumi-satya-production.up.railway.app` (or empty to use Netlify proxy) |

### 5.2 Build & Test Verification Commands

```bash
# 1. Run Backend Automated Test Suite (16 Tests)
cd backend
.\venv\Scripts\python -m pytest

# 2. Run Frontend Production Bundle Build
cd ../frontend
npm run build

# 3. Test Railway Preflight CORS Directly
python -c "import urllib.request; req = urllib.request.Request('https://bhumi-satya-production.up.railway.app/api/v1/auth/login', headers={'Origin': 'https://bhumi-satya.netlify.app', 'Access-Control-Request-Method': 'POST'}, method='OPTIONS'); print('STATUS:', urllib.request.urlopen(req).status)"
```

---

## 6. Operational Troubleshooting Cheatsheet

### Q: What should I do if the browser keeps showing "Network Error"?
1. Open Google Chrome Developer Tools (<kbd>F12</kbd>).
2. Go to the **Network** tab.
3. Attempt to sign in again and locate the `/auth/login` request.
4. Check the **Status Code** and **Response Headers**:
   - If the preflight `OPTIONS` status is `400 Disallowed CORS origin`, ensure `ALLOWED_ORIGINS` on Railway includes your exact Netlify domain.
   - If the request is pending, verify Railway service health status at `https://bhumi-satya-production.up.railway.app/health`.

### Q: How do I manually reset cached auth credentials in Chrome?
1. Open Developer Tools (<kbd>F12</kbd>).
2. Switch to the **Console** tab.
3. Run:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```
4. Re-enter demo credentials on the `/login` screen.
