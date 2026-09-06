# BHUMI-SATYA – Project Overview

## 1. What is BHUMI-SATYA?

**BHUMI-SATYA** is a Land Record Verification and Land Acquisition Management System.

The main purpose of the project is to provide a centralized platform where authorized users can manage and verify land parcel information, landowner details, geographical data, evidence, verification results, alerts, and audit activities.

The system focuses on making land-related information more organized, traceable, and easier to verify.

The basic workflow is:

$$\text{Land Data} \longrightarrow \text{Evidence} \longrightarrow \text{Verification} \longrightarrow \text{Decision} \longrightarrow \text{Audit}$$

---

## 2. Main Technologies Used

### Frontend
- **React 18**
- **Vite**
- **React Router v6**
- **Axios**
- **Vanilla / Tailwind CSS**

### Backend
- **Python 3.11+**
- **FastAPI**
- **Uvicorn**
- **SQLAlchemy ORM**
- **Pydantic v2**
- **JWT Authentication** (`python-jose`, `passlib[bcrypt]`)
- **Role-Based Access Control (RBAC)**

### Database / GIS
- **PostgreSQL 16 + PostGIS 3.4**
- **GeoAlchemy2**
- **Shapely**

### Deployment & DevOps
- **Frontend Hosting**: Netlify
- **Backend Hosting**: Railway (Docker containerized)
- **Version Control**: GitHub
- **Production URL (Frontend)**: `https://bhumi-satya.netlify.app`
- **Production URL (Backend)**: `https://bhumi-satya-production.up.railway.app`

---

## 3. Project Architecture

The project is structured into two main tiers:

```text
BHUMI-SATYA
│
├── Frontend
│   └── React + Vite (SPA)
│
└── Backend
    └── FastAPI
        │
        └── Database
            └── PostgreSQL + PostGIS
```

- **Frontend**: Serves the user interface, interactive map views, audit trails, and forms.
- **Backend**: Exposes REST APIs, enforces authentication & authorization (RBAC), runs business logic, executes GIS geometry checks, evaluates evidence, and tracks immutable audit logs.

---

## 4. Frontend

The frontend source is located in: `frontend/`

```text
frontend/src/
│
├── App.jsx            # Top-level routing & layout shell
├── main.jsx           # React DOM root entry point
├── components/        # Reusable UI widgets, ProtectedRoute, Map components
├── context/           # React Contexts (AuthContext, ThemeContext)
├── pages/             # View containers (Dashboard, Map, ParcelDetail, Login, etc.)
└── services/          # Axios API layer, theme helpers
```

### Important Pages
- **Dashboard**: High-level status overview, metrics, and land acquisition progress.
- **Map View**: Interactive spatial visualizer showing geographical boundaries of land parcels and corridors.
- **Parcel Detail**: Comprehensive dossier for a selected parcel (ownership, spatial bounds, timeline, evidence).
- **Landowner Portal**: Dedicated view displaying landowner identity and parcel ownership records.
- **Alerts View**: Flagged discrepancies (e.g. GPS spoofing, boundary overlaps, missing documentation).
- **Login**: Officer authentication portal with role presets.

---

## 5. Backend

The backend source is located in: `backend/app/`

```text
backend/app/
│
├── api/               # API route controllers
│   ├── alerts.py      # Alert listing and resolution
│   ├── auth.py        # Login, token issuance, current user profile (/me)
│   ├── evidence.py    # Evidence attestation and automated verdict evaluation
│   ├── landowner.py   # Public/citizen parcel verification
│   ├── parcels.py     # Parcel CRUD and milestone stage transitions
│   └── projects.py    # Land acquisition corridor projects
│
├── auth/
│   └── rbac.py        # Role-Based Access Control decorators and dependencies
│
├── models/
│   └── domain.py      # SQLAlchemy relational and spatial models
│
├── schemas/
│   └── dto.py         # Pydantic data transfer schemas and validation
│
├── services/          # Business logic engines
│   ├── attestation_service.py # Evidence hashing & signal evaluation
│   ├── audit_service.py       # Append-only audit logger
│   ├── gis_service.py         # Point-in-polygon & spatial calculations
│   ├── seed_service.py        # Demo dataset initialization
│   └── verdict_service.py     # Confidence score & milestone decision engine
│
└── utils/
    ├── geo_helpers.py # Spatial conversion utilities (GeoJSON, WKT)
    └── security.py    # Password hashing and JWT generation
```

---

## 6. Authentication Flow

The project utilizes stateless JWT (JSON Web Token) authentication.

```text
User
 │
 │ Official Email + Password
 ↓
Frontend Login (/login)
 │
 ↓
POST /api/v1/auth/login
 │
 ↓
Backend verifies credentials (bcrypt)
 │
 ↓
JWT Token generated (HS256, 7-day expiry)
 │
 ↓
Frontend stores token in localStorage
 │
 ↓
GET /api/v1/auth/me (Authorization: Bearer <TOKEN>)
 │
 ↓
User profile returned
 │
 ↓
Navigate to Protected Dashboard (/)
```

For all subsequent requests, Axios attaches the header:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 7. Role-Based Access Control (RBAC)

The backend enforces role permissions to restrict sensitive operations:

```text
Incoming Request
       │
       ▼
Extract Bearer Token
       │
       ▼
Verify JWT Signature & Expiration
       │
       ▼
Extract User Role (admin / surveyor)
       │
       ▼
Check Required Route Permission
       ├── Admin: Full Access (Manage Projects, Override Verdicts, Clear Alerts)
       └── Surveyor: Restricted Access (View Parcels, Submit Attestations/Evidence)
```

---

## 8. Land Parcel Management

The parcel module handles the digital lifecycle of every land unit:

- **Unique Identifiers**: Cadastral survey numbers, GIS parcel IDs, project association.
- **Attributes**: Landowner records, total area (sq. meters / hectares), classification (agricultural, residential, commercial).
- **Spatial Boundaries**: GeoJSON polygons with PostGIS spatial indexing.
- **Acquisition Milestones**: Section 4 notification $\rightarrow$ Section 11 preliminary survey $\rightarrow$ Section 19 declaration $\rightarrow$ Award / Possession.

---

## 9. GIS / Map Functionality

Spatial data handling is powered by **GeoAlchemy2** and **Shapely**:

```text
Land Parcel Coordinates (Lat / Lng)
               ↓
Shapely Geometry Objects (Polygons / MultiPolygons)
               ↓
PostGIS Database Spatial Indexes (GIST)
               ↓
GeoJSON Feature Collection
               ↓
Frontend MapLibre GL Vector Map Rendering
```

- **Point-in-Polygon (PIP)**: Accurately checks whether a field officer's reported coordinates fall strictly within the statutory parcel boundary.

---

## 10. Evidence and Verification (5-Signal Engine)

The verification process determines acquisition validity based on 5 independent signals:

$$\text{Land Parcel} \longrightarrow \text{Evidence Submission} \longrightarrow \text{Multi-Signal Scoring} \longrightarrow \text{Automated Verdict}$$

1. **$S_{\text{PIP}}$ (25%)**: Point-in-Polygon geometric inclusion (`ST_Contains`).
2. **$S_{\text{Device}}$ (20%)**: Hardware integrity & absence of mock/spoofed GPS providers.
3. **$S_{\text{Net}}$ (15%)**: Cellular tower & network BSSID correlation.
4. **$S_{\text{Beacon}}$ (20%)**: Cryptographic on-site BLE beacon verification.
5. **$S_{\text{Hash}}$ (20%)**: Cryptographic SHA-256 hash chaining of captured photographs.

### Verdict Classifications
- **90% – 100%**: `VERIFIED`
- **70% – 89%**: `REVIEW`
- **40% – 69%**: `WARNING`
- **< 40%**: `BLOCKED`

---

## 11. Audit Timeline

An immutable, append-only audit trail logs every critical action:

```text
Parcel Registered
       ↓
Surveyor Assigned
       ↓
Evidence Uploaded (Attestation Hash Recorded)
       ↓
Automated Verdict Generated
       ↓
Milestone Stage Advanced
       ↓
Decision Logged with Officer Timestamp & Digital Signature
```

---

## 12. Alerts Engine

Monitors potential conflicts or compliance issues:

- **Mock Location Alert**: Triggered if device GPS spoofing flags are active.
- **Boundary Discrepancy**: Triggered if field coordinates deviate beyond the tolerance threshold.
- **Incomplete Evidence**: Triggered when statutory milestones are advanced without prerequisite attestations.

---

## 13. Projects / Land Acquisition Corridors

Organizes parcels into cohesive infrastructure projects (e.g. *Nagpur Metro Line 3 Corridor*):

```text
Project (Corridor)
   │
   ├── Land Parcels (Survey Units)
   ├── Landowners (Beneficiaries)
   ├── Compensation & Award Estimates
   └── Consolidated Acquisition Progress (%)
```

---

## 14. Database Design

Implemented with **SQLAlchemy ORM** targeting **PostgreSQL + PostGIS**:

- **`users`**: Official credentials, roles, email, active status.
- **`projects`**: Corridors, acquisition budgets, timelines.
- **`parcels`**: Geometry polygons, acquisition stages, area calculations.
- **`landowners`**: Ownership records, contact details, bank/compensation data.
- **`attestations`**: 5-signal telemetry, officer signatures, photo hashes.
- **`verdicts`**: Confidence scores, verification outcomes.
- **`alerts`**: High-priority discrepancies and resolution audit notes.
- **`audit_logs`**: Append-only event history.

---

## 15. Complete Application Flow

```text
                    BHUMI-SATYA
                         │
                         ▼
                       Login
                         │
                         ▼
                 JWT Authentication
                         │
                         ▼
                     Dashboard
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Parcels         Map View       Alerts
          │
          ▼
    Parcel Details
          │
          ├────────→ Landowner Information
          │
          ├────────→ Evidence Dossier
          │
          ├────────→ Verification Engine
          │
          └────────→ Automated Verdict
                         │
                         ▼
                   Audit Timeline
```

---

## 16. Production Deployment

- **Frontend**: Hosted on **Netlify** (`https://bhumi-satya.netlify.app`)
  - Automated continuous deployment from GitHub `main`.
  - Configured with SPA rewrite rules and `/api/*` reverse proxy in `netlify.toml`.
- **Backend**: Containerized and hosted on **Railway** (`https://bhumi-satya-production.up.railway.app`)
  - Runs FastAPI via Uvicorn on port `8000`.
  - CORS configured to accept Netlify production and preview origins.

---

## 17. Backend API Summary

- `POST /api/v1/auth/login`: Issue JWT token.
- `GET /api/v1/auth/me`: Retrieve current user profile.
- `GET /api/v1/projects/`: List acquisition corridors.
- `GET /api/v1/parcels/`: List and filter land parcels.
- `GET /api/v1/parcels/{id}`: Detailed parcel dossier.
- `POST /api/v1/parcels/{id}/stage`: Transition acquisition milestone.
- `POST /api/v1/evidence`: Submit field evidence attestation.
- `POST /api/v1/evidence/evaluate/{parcel_id}`: Run 5-signal verdict scoring.
- `GET /api/v1/alerts/`: List active and resolved alerts.
- `GET /api/v1/audit-logs/`: Query chronological audit trail.
- `GET /api/v1/landowner/parcel/{code}`: Citizen landowner parcel inquiry.

---

## 18. Running Locally

### Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend will be available at: `http://localhost:8000` (Swagger docs: `http://localhost:8000/docs`).

### Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
Frontend development server will be available at: `http://localhost:5173`.

---

## 19. Docker Deployment

The backend `Dockerfile` packages:
1. Python 3.12 slim base image.
2. System GIS dependencies (`libgeos-dev`, `gdal-bin`).
3. Python package dependencies via `requirements.txt`.
4. Production entrypoint: `uvicorn app.main:app --host 0.0.0.0 --port 8000`.

---

## 20. Security Features

- Cryptographic password hashing (`bcrypt`).
- Signed JWT Bearer tokens with strict 7-day expiration.
- Role-Based Access Control (RBAC) on all mutating endpoints.
- FastAPI CORS protection supporting production Netlify domains.
- Client-side route guards with loading state barriers.
- Immutable append-only audit trail logging.

---

## 21. Summary

> **BHUMI-SATYA is a land-record verification and land acquisition management platform. It allows authorized users to log in securely, manage land parcels and landowners, visualize parcels using GIS/map functionality, review evidence, perform verification, view alerts, manage project-related land information, and track activities through an audit timeline. The frontend is built with React/Vite, the backend uses FastAPI/Python, the database layer uses SQLAlchemy/PostgreSQL, and JWT + RBAC are used for security. The frontend is deployed on Netlify and the backend on Railway.**
