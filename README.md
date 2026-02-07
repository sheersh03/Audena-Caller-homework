# Audena Call Simulator — Full-Stack Homework

A small, user-facing product that demonstrates how I design a simple “AI voice call” workflow:
a user triggers a call request, the backend persists it, an external (simulated) provider processes it asynchronously, and a webhook updates the call status.

This exercise intentionally avoids real telephony/AI and focuses on **clarity, pragmatism, API design, integrations, and state transitions**.

---

## ✅ What’s included

### Frontend (Next.js / React)

* Create a call request by entering:

  * Customer name
  * Phone number
  * Workflow: **Support / Sales / Reminder**
* View call history:

  * Customer name, phone number, workflow
  * Status: **PENDING / COMPLETED / FAILED**
* Minimal UI + basic responsive layout
* Lightweight polling while there are pending calls

### Backend (Node.js)

* REST-style endpoints to:

  * Create a call
  * List calls
  * Update call status (manual)
* **Database**: SQLite via Prisma — either **file-based** (local/Docker) or **Turso** (serverless, for Netlify/Vercel)

### Simulated External Integration (Twilio-like)

* “Provider send-call” endpoint that simulates sending a call
* Webhook endpoint that updates status asynchronously
* Random completion/failure + small delay to mimic real telephony lifecycle

---

## 🧠 System Flow (high-level)

1. User submits a call request from UI
2. Backend creates DB record with `status = PENDING`
3. Backend triggers the **simulated provider** (`/api/provider/send-call`)
4. Provider schedules an async callback and hits the webhook (`/api/webhooks/provider-status`)
5. Webhook updates DB status to `COMPLETED` or `FAILED`
6. UI reflects the updated status (polling while pending)

> Note: The “provider” is **logically external** (Twilio-like), but implemented inside this repo for simplicity as allowed by the assignment.

---

## 🧰 Tech Stack

* **Next.js (App Router) + React**
* **TypeScript**
* **Tailwind CSS**
* **Prisma + SQLite** (file-based locally, or **Turso** for serverless)
* **Zod** for request validation
* **Docker + Docker Compose** for one-command setup
* **Turso** (optional) — serverless SQLite via libSQL for production (Netlify/Vercel)

---

## 📁 Project Structure (overview)

* `app/` — UI pages + API routes
* `components/` — UI components (form, table, status badge)
* `lib/` — helpers (db, validation, provider logic, auth)
* `prisma/` — Prisma schema + `turso-schema.sql` (for Turso)
* `Dockerfile`, `docker-compose.yml` — containerization
* `netlify.toml` — Netlify build config

---

# 🚀 How to Run the Project

## Option A — Run Locally (recommended for development)

### ✅ Prerequisites

* Node.js 18+ (Node 20 recommended)
* npm
* (Optional) Docker installed if you want to run with Compose

### 1) Install dependencies

```bash
npm install
```

### 2) Create environment file

```bash
cp .env.example .env
```

### 3) Generate Prisma client

```bash
npm run db:generate
```

### 4) Create/update DB schema

* **File SQLite:** - (creates/updates e.g. `./data/dev.db`).

```bash
npm run db:push
```

### 5) Start the dev server

```bash
npm run dev
```

### 6) Open the app

* [http://localhost:3000](http://localhost:3000)

---

## Option B — Run with Docker (recommended for reviewers)

> This is the “runs in one go” path for interviewers/reviewers.

### ✅ Prerequisites

* Docker Desktop
* Docker Compose (comes with Docker Desktop)

### 1) Create environment file

```bash
cp .env.example .env
```

### 2) Build and run

```bash
docker compose up --build
```

### 3) Open the app

* [http://localhost:3000](http://localhost:3000)

### 4) Stop

```bash
docker compose down
```

### 5) Reset DB (optional)

If you want a clean DB:

```bash
docker compose down -v
```

---
 
## Option C — Our App is soft live on Netlify with Turso-backed realtime transactions

Go to: [https://audenacaller.netlify.app](https://audenacaller.netlify.app)

---

# 🔌 API Endpoints

## Create a call

`POST /api/calls`

Body:

```json
{
  "customerName": "Sheersh",
  "phoneNumber": "+91 98765 43210",
  "workflow": "SUPPORT"
}
```

Response: created call with status `PENDING`

---

## List calls

`GET /api/calls`

Response:

```json
{
  "calls": [ ... ]
}
```

---

## Update call status manually (optional helper)

`PATCH /api/calls/:id`

Body:

```json
{ "status": "FAILED" }
```

---

## Provider simulation (Twilio-like)

`POST /api/provider/send-call`

* Assigns a `providerId`
* Schedules an async webhook callback to update status

---

## Provider webhook callback

`POST /api/webhooks/provider-status`

* Updates call status to `COMPLETED` or `FAILED`
* Idempotent for terminal statuses

---

# 🔐 Optional: Simple Auth Token (Nice-to-have)

This project includes **optional** API protection using a static bearer token.

### Enable it

Set in `.env` (and on Netlify/Vercel if you deploy):

```env
API_TOKEN="my-secret-token"
NEXT_PUBLIC_API_TOKEN="my-secret-token"
```

The frontend uses `NEXT_PUBLIC_API_TOKEN` for `Authorization: Bearer ...`; the API validates against `API_TOKEN`. Keep both the same value.

If `API_TOKEN` is empty, auth is **disabled** (default) to keep setup friction-free for reviewers.

---

# ✅ Key Design Decisions

### 1) Single repo, single runtime (Next.js for UI + API)

* Keeps setup simple and review-friendly
* Still enforces clean boundaries via separate API routes and modules

### 2) SQLite + Prisma for persistence (file or Turso)

* **Local/Docker:** file-based SQLite (`DATABASE_URL=file:...`); zero infra, easy to run.
* **Production (Netlify/Vercel):** **Turso** (serverless SQLite via libSQL) so we keep the same Prisma/SQLite model without running Postgres.

### 3) Workflows and status as strings (validated at API boundary)

* SQLite does not support native enums in Prisma for some connectors
* Stored as strings, enforced via **Zod** validation
* Easy to migrate to Postgres enums later if needed

### 4) Provider + webhook modeled explicitly (async state change)

* Mirrors real telephony lifecycle:

  * request → processing → callback → status update
* Uses delayed callback + random success/failure to exercise both paths
* Webhook designed to be idempotent for terminal states

### 5) Clear, small modules for maintainability

* `lib/db.ts` for Prisma singleton
* `lib/validators.ts` for Zod validation
* `lib/provider.ts` for provider timing/outcome knobs
* `lib/auth.ts` for optional simple auth

---

# ⏳ What I Would Improve With More Time

### Reliability / production realism

* Webhook signature verification (Twilio-style signing) + replay protection
* Provider request retry strategy + dead-letter handling
* Replace `setTimeout` with a tiny job queue (BullMQ / Redis) or background worker

### Product / UX

* Filters + search (by workflow/status/date)
* Pagination for long histories
* “Call detail” page to inspect payloads / webhook events (internal tooling style)

### Engineering quality

* Tests:

  * API route tests (supertest / next-test-api-route-handler)
  * UI tests (Playwright)
* Structured logging (request IDs, provider IDs)
* CI workflow (lint, typecheck, tests)

---

## Notes / Trade-offs

This solution intentionally prioritizes **clarity and ease of review** over advanced architecture.
It’s designed to be readable, explainable, and runnable on a reviewer’s machine with minimal steps — while still modeling realistic integration boundaries and state transitions.
