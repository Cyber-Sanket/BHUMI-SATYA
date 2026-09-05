# BHUMI-SATYA — Interoperable Evidence Layer for Land Acquisition

> **SIH 2026 — Problem Statement ID:** SIH26016  
> **Theme:** Miscellaneous | **Team:** THE SCOUTS  
> **Core Concept:** *Records of evidence, not records of claims.*

---

## 1. Project Vision

**BHUMI-SATYA** is an interoperable, mathematically backed evidence & decision-support layer designed to bind statutory land acquisition milestones to cryptographically signed, multi-signal geographically verified field evidence.

Rather than relying on unverified status claims, BHUMI-SATYA maintains a **Live Digital Twin** for every land parcel featuring:
- Spatial geometry & point-in-polygon (PIP) spatial boundaries
- Statutory acquisition stage state machine tracking
- 5-Signal evidence attestation & confidence scoring (0–100%)
- Automated alert generation for GPS/Mock location mismatches
- Immutable, append-only audit trail logging

---

## 2. Architecture & 5-Signal Confidence Engine

```
┌────────────────────────────────────────────────────────────────────────┐
│                        REACT + MAPLIBRE WEB DASHBOARD                  │
│               (Parcel Digital Twin, GIS Visualizer, Alerts)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API / JWT Auth
┌───────────────────────────────────▼────────────────────────────────────┐
│                         FASTAPI BACKEND SERVICE                        │
│ ┌──────────────┐ ┌────────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Auth & RBAC  │ │ GIS Engine     │ │ Verdict &    │ │ Alert &      │ │
│ │ (JWT / Roles)│ │ (PostGIS / PIP)│ │ Confidence   │ │ Audit Engine │ │
│ └──────────────┘ └────────────────┘ └──────────────┘ └──────────────┘ │
└─────────────────┬──────────────────┬───────────────────┬───────────────┘
                  │                  │                   │
┌─────────────────▼──────────────┐ ┌─▼───────────────────▼──────────────┐
│  POSTGRESQL + POSTGIS DATABASE │ │ FLUTTER MOBILE FIELD APP           │
│  (Parcels, Spatial Indexes,    │ │ (Offline Queue, Attestation,       │
│   Attestations, Audit Logs)    │ │  GPS + Mock Location Check)        │
└────────────────────────────────┘ └────────────────────────────────────┘
```

### 5-Signal Confidence Score Formula

$$\text{Confidence Score} = S_{\text{PIP}} \times 0.25 + S_{\text{Device}} \times 0.20 + S_{\text{Net}} \times 0.15 + S_{\text{Beacon}} \times 0.20 + S_{\text{Hash}} \times 0.20$$

Where:
- **$S_{\text{PIP}}$ (25%)**: 100% if field GPS is strictly inside parcel geometry polygon (`ST_Contains`); decays rapidly if outside.
- **$S_{\text{Device}}$ (20%)**: 100% if OS mock location is `False` & Play Integrity passes; 0% if mock location is flagged.
- **$S_{\text{Net}}$ (15%)**: Cell tower ID & Wi-Fi BSSID cross-reference.
- **$S_{\text{Beacon}}$ (20%)**: On-site BLE beacon token verification.
- **$S_{\text{Hash}}$ (20%)**: Cryptographic SHA-256 photo hash verification chain.

### Verdict Thresholds
- **90% – 100%** $\rightarrow$ `VERIFIED`
- **70% – 89%** $\rightarrow$ `REVIEW`
- **40% – 69%** $\rightarrow$ `WARNING`
- **< 40%** $\rightarrow$ `BLOCKED`

---

## 3. Technology Stack

- **Backend**: FastAPI, Python 3.12, Uvicorn, SQLAlchemy 2.x, GeoAlchemy2, Shapely, Pydantic v2, Pytest, JWT Authentication.
- **Database**: PostgreSQL 16 + PostGIS 3.4 (`postgis/postgis:16-3.4`).
- **Frontend**: React 18, Vite, MapLibre GL JS, Recharts, Lucide Icons, Glassmorphism TailwindCSS/CSS styling.
- **Mobile**: Flutter 3, SQLite (`sqflite`), `geolocator`, `crypto`.
- **Deployment**: Docker Compose & Nginx.

---

## 4. Directory Structure

```text
BHUMI-SATYA/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (auth, projects, parcels, evidence, alerts, landowner)
│   │   ├── auth/         # RBAC dependencies & JWT token decoding
│   │   ├── models/       # SQLAlchemy Domain Models & Enums
│   │   ├── schemas/      # Pydantic DTOs
│   │   ├── services/     # GIS engine, Attestation 5-signal calculator, Verdict & Audit loggers
│   │   ├── utils/        # Security & Haversine / PIP spatial helpers
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── tests/            # Pytest test suite
│   ├── seed_data.py      # Seed script for 4 Nagpur demo parcels
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Navbar, Sidebar, ParcelCard, ConfidenceGauge, AuditTimeline, FieldSimulatorModal
│   │   ├── pages/        # Dashboard, MapView, ParcelDetail, AlertsView, LandownerPortal
│   │   ├── services/     # Axios API & MapLibre utils
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── mobile/               # Flutter offline field capture app foundation
├── database/             # PostGIS schema migration scripts
├── docker-compose.yml
└── README.md
```

---

## 5. Quickstart & Local Development

### Option A: Local Run (FastAPI + React)

1. **Setup Backend**:
   ```bash
   cd backend
   python -m venv venv
   # On Windows: venv\Scripts\activate | On Linux/macOS: source venv/bin/activate
   pip install -r requirements.txt
   python seed_data.py
   uvicorn app.main:app --reload --port 8000
   ```

2. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

### Option B: Docker Compose

```bash
docker-compose up --build
```
- Dashboard: `http://localhost:3000`
- FastAPI Docs: `http://localhost:8000/docs`

---

## 6. Seed Data & Demo Scenario

### Demo Accounts
- **Admin**: `admin@bhumisatya.gov.in` / `AdminPass123!`
- **Field Officer**: `field1@bhumisatya.gov.in` / `FieldPass123!`

### The 4 Nagpur Demo Parcels
1. **`MH-NGP-0141`** (Khasra 112/1): **VERIFIED (95.0%)** — On-site verified evidence, inside parcel boundary.
2. **`MH-NGP-0142`** (Khasra 112/2): **VERIFIED (92.5%)** — Award & Compensation completed.
3. **`MH-NGP-0143`** (Khasra 113/1): **BLOCKED (36.0%)** — **51 km GPS mismatch** (submitted from Wardha) + Mock Location flag. Generates high-severity `POSSESSION MISMATCH` alert and rejects state change.
4. **`MH-NGP-0144`** (Khasra 113/2): **REVIEW (74.5%)** — 65 days evidence age decay & missing BLE beacon.

---

## 7. Running Tests

Execute the backend pytest suite covering health check, auth, spatial PIP, 51 km mismatch detection, 5-signal attestation scoring, and audit log generation:

```bash
backend/venv/Scripts/pytest backend/tests/ -v
```

---

## 8. License & Team

Developed for **Smart India Hackathon (SIH) 2026** — Team **THE SCOUTS**.
