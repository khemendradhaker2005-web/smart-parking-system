# 🅿️ ParkSmart - Intelligent Campus Parking Management System
### Enterprise Full-Stack Web Application with Staff & Customer Portals

ParkSmart is a production-grade, full-stack Smart Parking Management System designed for educational institutions, corporate tech parks, and commercial campuses. It features two decoupled, role-enforced portals: **Staff Portal** (for gate operators, shift supervisors, and parking admins) and **Customer Portal** (for students, faculty, and visitors), backed by PostgreSQL, Node.js/Express, Socket.IO real-time event broadcasting, Leaflet interactive maps, dynamic UPI QR billing, and Recharts operational analytics.

---

## 🏗️ Architecture & Technology Stack

```
               ┌────────────────────────────────────────────────────────┐
               │              Client Layer (Vite 6 / React 18)          │
               │  • Tailwind CSS  • Lucide React  • Leaflet Maps        │
               │  • Recharts      • Socket.IO Client  • QRCode.react    │
               └───────────┬────────────────────────────────┬───────────┘
                           │ HTTPS (REST API)               │ WSS (WebSockets)
                           ▼                                ▼
               ┌────────────────────────────────────────────────────────┐
               │           API & Realtime Layer (Node.js / Express)      │
               │  • Dynamic PORT & 0.0.0.0 binding (Render-ready)       │
               │  • Dual Health Endpoints (/health, /api/health)        │
               │  • JWT Authentication & Role-Based Middleware          │
               │  • Socket.IO Rooms: user_{id}, staff_room, location_{id}│
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                   Persistence Layer                     │
               │  • Primary: PostgreSQL (DATABASE_URL + SSL pool)       │
               │  • Fallback: In-memory/file SQL.js (SQLite adapter)    │
               │  • Decoupled DDL migration (npm run db:init)           │
               │  • Idempotent initial seed (npm run seed)              │
               └────────────────────────────────────────────────────────┘
```

| Layer | Technologies & Dependencies | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, Lucide React, Recharts, Leaflet, React-Leaflet, QRCode.react | Responsive SPA with Staff & Customer views |
| **Backend** | Node.js, Express.js, Socket.IO 4, JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `qrcode` | Secure REST API, real-time broadcasts, QR generation |
| **Database** | PostgreSQL (`pg` pool with SSL), SQL.js fallback | Relational data persistence with atomic transactions |
| **Deployment** | Render Blueprint (`render.yaml`), Render Static Site, Render Web Service, Render PostgreSQL | Cloud hosting and infrastructure-as-code |

---

## 🌟 Key Features

### 1. Decoupled Role-Enforced Portals
- **Landing Page**: Hero presentation, live interactive map preview, transparent ₹20/hr pricing rule card, and one-click quick portal switches.
- **Customer Registration**: One-time registration with Full Name, Vehicle RC number, 10-digit Mobile, Email, and bcrypt-hashed Password.
- **Staff Authentication**: Authorized staff credentials only (no public registration).
- **Server-Side Security**: JWT authentication middleware (`authenticateToken` + `requireRole('staff')` / `requireRole('customer')`).

### 2. Customer Portal
- **Live Parking Status**: When staff records vehicle entry, customer dashboard dynamically updates with:
  - Welcome banner with parking name
  - Vehicle Registration Number & Assigned Slot Number
  - Live ticking duration counter (`H:M:S`)
  - Real-time Socket.IO notification
- **Parking Discovery & Map**:
  - Interactive Leaflet map with custom status badges (`🅿️ Available Slots`).
  - Search by campus zone or parking location name.
  - Filter by slot availability and real GPS distance.
  - Sort by rating, distance, or price.
- **Atomic Slot Reservation**:
  - Duration-based reservation with instant slot allocation.
  - Generates unique Booking Code (`BK-XXXXXX`) and contactless check-in pass.
  - Prevents race conditions using atomic database transactions.
- **Vehicle Exit & Dynamic UPI QR Billing**:
  - Calculates fees using `MAX(1, CEILING(hours)) × ₹20` (minimum charge: ₹20).
  - Generates standard UPI QR code string (`upi://pay?pa=...&am=...`).
  - Official digital tax invoice and printable receipt with receipt number and timestamps.
- **Personal Customer Analytics**:
  - Total Visits, Lifetime Spend, Cumulative Hours, Most Frequent Parking Location.
  - Monthly expense trend area chart with Recharts.

### 3. Staff Operations Portal
- **8 KPI Metric Cards**:
  Total Slots, Available Slots, Occupied Slots, Active Vehicles, Today's Entries, Today's Exits, Pending Payments, and Today's Revenue.
- **Gate Entry / Check-In Management**:
  - Instant lookup of pre-booked vehicles or allocation of available bays for walk-in arrivals.
  - Changes slot status to `occupied` and notifies customer in real-time.
- **Gate Exit / Departure Management**:
  - Search active vehicles by vehicle number, mobile, customer name, booking ID, or slot.
  - Records exact exit time, calculates ₹20/hr fee, and generates UPI QR code.
  - Releases slot only upon verified payment.
  - Manual override for disputes with mandatory reason notes and permanent audit logging in `activity_logs`.
- **Visual Slot Grid**:
  - Color-coded grid (Green: Available, Red: Occupied, Amber: Reserved, Slate: Maintenance).
  - Filter by floor level or section.
  - Click any slot to view occupant modal and toggle maintenance mode.
- **Customer Directory & History**: Searchable directory of registered users and immutable audit trail of past sessions.
- **Staff Slot Usage Analytics**: Slot usage frequency, 7-day vehicle flow, and daily revenue velocity.

---

## 🔑 Test Accounts

| Portal | Role | Mobile Number | Password | Notes |
|---|---|---|---|---|
| **Staff Portal** | Shift Supervisor | `9876543210` | `Password@123` | Authorized Pre-seeded Staff Account |
| **Staff Portal** | Gate Operator | `9876543211` | `Password@123` | Authorized Pre-seeded Staff Account |
| **Customer Portal** | Registered Customer | `9123456780` | `Password@123` | Primary Vehicle: `KA01AB1234` |
| **Customer Portal** | Registered Customer 2 | `9876501234` | `Password@123` | Primary Vehicle: `MH12CD5678` |

*(One-click demo autofill buttons are also embedded on both login pages for effortless testing!)*

---

## 🚀 Deployment on Render

ParkSmart is pre-configured for seamless deployment on [Render](https://render.com) using two methods: **Render Blueprint (Recommended)** or **Manual Service Setup**.

### Method A: Automated Deployment via Render Blueprint (Recommended)

1. Fork or push this repository to your GitHub account:
   `https://github.com/khemendradhaker2005-web/parksmart-campus-parking.git`
2. Log in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** and select **Blueprint**.
4. Connect your GitHub repository `parksmart-campus-parking`.
5. Render will detect the root [`render.yaml`](render.yaml) and display three resources to provision:
   - **`parksmart-db`**: Render Managed PostgreSQL Database (Free tier)
   - **`parksmart-backend`**: Node.js Web Service
   - **`parksmart-frontend`**: React Static Site with SPA fallback
6. Click **Apply**. Render will automatically provision the database, build the backend, inject `DATABASE_URL`, build the frontend, and link the services together!

---

### Method B: Manual Service Setup in Render Dashboard

If you prefer configuring services manually in the Render dashboard:

#### 1. Database: Render PostgreSQL
1. Click **New +** -> **PostgreSQL**.
2. **Name**: `parksmart-db`
3. **Database**: `smart_parking_db`
4. **User**: `smart_parking_user`
5. **Region**: `Oregon (US West)` (or closest to you)
6. **Plan**: `Free`
7. Click **Create Database**.
8. Copy the **Internal Database URL** (e.g., `postgres://smart_parking_user:...@dpg-...-a/smart_parking_db`).

#### 2. Backend: Render Web Service
1. Click **New +** -> **Web Service**.
2. Connect your GitHub repository `parksmart-campus-parking`.
3. Configure settings:
   - **Name**: `parksmart-backend`
   - **Region**: Same as database (e.g. `Oregon`)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
   - **Health Check Path**: `/health`
4. In **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DATABASE_URL`: *(Paste the Internal Database URL from Step 1)*
   - `DB_SSL`: `true`
   - `JWT_SECRET`: *(A random 32+ character string, e.g. generate via `openssl rand -hex 32`)*
   - `CORS_ORIGIN`: `*`
   - `AUTO_SEED`: `true`
   - `UPI_VPA`: `smartparking@icici`
   - `UPI_PAYEE_NAME`: `Smart Parking System`
5. Click **Deploy Web Service**.
6. Once deployed, copy your backend URL (e.g., `https://parksmart-backend.onrender.com`).

#### 3. Frontend: Render Static Site
1. Click **New +** -> **Static Site**.
2. Connect your GitHub repository `parksmart-campus-parking`.
3. Configure settings:
   - **Name**: `parksmart-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://parksmart-backend.onrender.com/api` (Replace with your actual backend URL from Step 2)
   - `VITE_SOCKET_URL`: `https://parksmart-backend.onrender.com` (Optional; automatically derived if omitted)
5. In **Redirects / Rewrites** (or rely on built-in `public/_redirects`):
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
6. Click **Create Static Site**.

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | HTTP port backend listens on | `5001` locally, `10000` on Render |
| `NODE_ENV` | Application environment | `development` / `production` |
| `DATABASE_URL` | Full PostgreSQL connection string with credentials | `postgres://user:pass@host:5432/dbname` |
| `DB_SSL` | Enable SSL for PostgreSQL connection pool | `true` |
| `DB_POOL_MAX` | Maximum concurrent connections in pool | `10` |
| `JWT_SECRET` | Secret key for signing and verifying JSON Web Tokens | `secure_random_key_here` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated or `*`) | `*` or `https://parksmart-frontend.onrender.com` |
| `AUTO_SEED` | Automatically run demo seeding on startup if database is empty | `true` |
| `USE_EMBEDDED_DB` | Force embedded SQLite engine (ignores PostgreSQL) | `false` |
| `UPI_VPA` | UPI Virtual Payment Address for dynamic billing QR | `smartparking@icici` |
| `UPI_PAYEE_NAME` | Payee display name encoded in UPI payment QR | `Smart Parking System` |

### Frontend (`frontend/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_URL` | Base URL of backend REST API | `https://parksmart-backend.onrender.com/api` |
| `VITE_SOCKET_URL` | URL of backend Socket.IO server | `https://parksmart-backend.onrender.com` |

---

## 💻 Local Development Setup

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v20/v22/v26)
- **npm** v9+
- Optional: Local PostgreSQL instance (if not present, backend automatically uses embedded SQLite)

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# (Optional) Initialize database schema manually
npm run db:init

# (Optional) Seed demo accounts and locations
npm run seed

# Start development server with auto-reload
npm run dev

# Or start standard server
npm start
```
The server will start on `http://localhost:5001`.
Verify health:
- `http://localhost:5001/health`
- `http://localhost:5001/api/health`

### 3. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🛠️ Verification & Health Checks

1. **Backend Health Check**:
   ```bash
   curl http://localhost:5001/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-11-17T09:00:00.000Z",
     "service": "ParkSmart Campus Parking API",
     "version": "1.0.0",
     "uptime": 12.3,
     "database": {
       "engine": "pg",
       "status": "connected"
     },
     "environment": "development"
   }
   ```

2. **Frontend Production Build**:
   ```bash
   cd frontend
   npm run build
   ```
   Build output will be generated cleanly in `frontend/dist`.

---

## 🛡️ Security & Production Hardening

- **No Hardcoded Credentials**: All passwords and secrets are loaded strictly from environment variables.
- **Safe Logging**: Database credentials in logs are automatically masked (`postgres://user:****@host/db`).
- **Idempotent Migrations**: Database initialization (`initSchema.js`) uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`, preventing accidental data loss.
- **Decoupled Seeding**: Seeding runs only if the `users` table is completely empty, ensuring existing operational data is never overwritten.
- **Git Hygiene**: Root `.gitignore` prevents `.env`, local `.db` files, logs, and `node_modules` from ever leaking into version control.
- **Graceful Shutdown**: Production server listens for `SIGTERM` and `SIGINT` to cleanly close open HTTP requests, WebSockets, and database pools within a 10s window.
- **SPA Fallback**: Includes both Render Blueprint rewrite rules and `frontend/public/_redirects` to eliminate 404 errors on browser page reloads.

---

## 📄 License
ISC License. Built for ParkSmart Campus Parking Operations.
