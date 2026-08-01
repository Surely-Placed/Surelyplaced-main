# Surely Placed — Payments API

Express + PostgreSQL + Knex backend for **PayPal** webinar checkout, Zoom registration, email, and Google Sheets sync. Deployed on **Fly.io**.

## Stack

- **Node.js 20** + Express
- **PostgreSQL** (Knex migrations; schema `surelyplaced`)
- **PayPal** Orders + webhooks
- **Zoom** Server-to-Server OAuth (meeting registrants)
- **Nodemailer** (SMTP)
- Optional **Google Apps Script** webhook for Sheets

## Quick start (local)

```powershell
cd server
# Copy/edit .env.development with Postgres + PayPal sandbox credentials

npm install
npm run migrate:latest
npm run dev
```

Health check: [http://localhost:8080/health](http://localhost:8080/health)

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Nodemon (loads `.env.development`) |
| `npm start` | Production start (loads `.env.production` locally) |
| `npm run migrate:latest` | Ensure schema + run migrations |
| `npm run migrate:rollback` | Roll back last migration |
| `npm run migrate:make` | Create a new migration |

## Environment files

| File | Use |
|------|-----|
| `.env.development` | Local (`npm run dev`, migrations) |
| `.env.production` | Local production reference — **do not commit secrets**; set real values as **Fly secrets** |

### Required / common variables

```env
NODE_ENV=development
PORT=8080

# DB — either DATABASE_URL or discrete fields
DATABASE_URL=postgresql://user:pass@host/theplugin?sslmode=require
DB_SCHEMA=surelyplaced
# Or:
# DB_HOST= DB_PORT=5432 DB_NAME=theplugin DB_USER= DB_PASSWORD=

PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=

FRONTEND_ORIGIN=http://localhost:3000
SITE_URL=http://localhost:3000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_APP_PASSWORD=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=
# WEBINAR_NOTIFY_EMAIL=   # optional; defaults to CONTACT_TO_EMAIL

ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=

WEBINAR_ADMIN_EMAIL=
WEBINAR_ADMIN_PASSWORD=
# WEBINAR_ADMIN_TOKEN_SECRET=

# GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec

# Webinar registration sheet — Apps Script /exec URL (see scripts/webinar-registration-sheet-apps-script.js)
# WEBINAR_REGISTRATION_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
```

Schema: **`surelyplaced`** inside the shared Postgres database (e.g. `theplugin` on Neon). Other projects can use other schemas in the same DB.

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | Health + DB check |
| GET | `/api/payments/config` | PayPal client id + mode for Buttons |
| POST | `/api/payments/orders` | Create PayPal order (`Idempotency-Key` required) |
| POST | `/api/payments/verify` | Capture after PayPal approval |
| GET | `/api/payments/orders/:id` | Order status |
| POST | `/api/webhooks/paypal` | PayPal webhook (raw body + transmission headers) |
| GET | `/api/webhooks/paypal/events` | Suggested webhook event list |
| POST | `/api/admin/login` | Webinar ops admin token |
| POST | `/api/admin/webinars` | Create webinar + Zoom meeting |
| PATCH | `/api/admin/webinars/:id/seats` | Change seat limits |
| GET | `/api/admin/attendees` | Payments / Zoom status |

All payments are **USD** only. Amounts are stored in **cents** (`$19.99` → `1999`).

## PayPal webhooks

Register in PayPal Dashboard → Webhooks (also listed at `GET /api/webhooks/paypal/events`):

| Event | Action |
|-------|--------|
| `PAYMENT.CAPTURE.COMPLETED` | Mark paid, store payment, Zoom register, emails |
| `CHECKOUT.ORDER.COMPLETED` | Mark paid only if a COMPLETED capture id is present |
| `CHECKOUT.ORDER.APPROVED` | Logged only — capture via `/verify` |
| `PAYMENT.CAPTURE.DENIED` / `DECLINED` / `REFUNDED` / `REVERSED` | Update order status |

Public webhook URL: `https://api.surelyplaced.com/api/webhooks/paypal`

Set `PAYPAL_WEBHOOK_ID` to the **Webhook ID** from the PayPal dashboard (not the URL).

## Zoom (paid-only access)

After a `webinar-live` order is marked **paid**, the API registers the buyer on Zoom and emails their join link.

1. Zoom **Pro** (or higher) with registration-enabled meetings
2. Create a **Server-to-Server OAuth** app with meeting registrant scopes
3. Set `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`

If Zoom env is missing, payment still succeeds; registration is skipped and logged.

## Google Sheets (optional)

Uses a **Google Apps Script web app URL** only (no service account).

After successful payment, one row is appended:

**Full Name | Email | Phone | Country | Current Status | Visa Status | Year Of Experience**

1. Create a sheet with that header row
2. Extensions → Apps Script → paste `scripts/google-sheets-apps-script.js`
3. Deploy → New deployment → **Web app** (Execute as: **Me**, Who has access: **Anyone**)
4. Set `GOOGLE_SHEETS_WEBHOOK_URL` to the `/exec` URL

If unset, Sheets sync is skipped.

## Webinar ops admin

Frontend route: `/sp-webinar-ops` (in `surely-placed-fe`).

Configure on this server:

```env
WEBINAR_ADMIN_EMAIL=
WEBINAR_ADMIN_PASSWORD=
```

Use the Bearer token from `POST /api/admin/login` for admin APIs.

---

## Deploy on Fly.io

App name: `surelyplaced-payments`  
Region: `lhr` (see `fly.toml`)  
Image: `Dockerfile` (runs schema ensure → migrations → `node src/index.js`)

### 1. Prerequisites

- [Fly CLI](https://fly.io/docs/flyctl/install/) installed
- Fly account with access to the org
- Postgres reachable from Fly (e.g. Neon `DATABASE_URL`)
- Custom hostname planned: `api.surelyplaced.com`

### 2. Login and create app (first time only)

```powershell
fly auth login
fly apps create surelyplaced-payments --org <your-org>
```

If the app already exists, skip create. Confirm with:

```powershell
fly status --app surelyplaced-payments
```

### 3. Set secrets

Never commit production secrets. Set them on Fly:

```powershell
fly secrets set `
  DATABASE_URL="postgresql://..." `
  DB_SCHEMA="surelyplaced" `
  PAYPAL_MODE="live" `
  PAYPAL_CLIENT_ID="xxx" `
  PAYPAL_CLIENT_SECRET="xxx" `
  PAYPAL_WEBHOOK_ID="xxx" `
  FRONTEND_ORIGIN="https://www.surelyplaced.com" `
  SITE_URL="https://www.surelyplaced.com" `
  SMTP_HOST="smtp.gmail.com" `
  SMTP_PORT="587" `
  SMTP_USER="you@surelyplaced.com" `
  SMTP_APP_PASSWORD="xxx" `
  CONTACT_TO_EMAIL="you@surelyplaced.com" `
  CONTACT_FROM_EMAIL="you@surelyplaced.com" `
  ZOOM_ACCOUNT_ID="xxx" `
  ZOOM_CLIENT_ID="xxx" `
  ZOOM_CLIENT_SECRET="xxx" `
  WEBINAR_ADMIN_EMAIL="xxx" `
  WEBINAR_ADMIN_PASSWORD="xxx" `
  GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/.../exec" `
  --app surelyplaced-payments
```

List / rotate:

```powershell
fly secrets list --app surelyplaced-payments
```

### 4. Custom domain + TLS

```powershell
fly certs add api.surelyplaced.com --app surelyplaced-payments
fly certs show api.surelyplaced.com --app surelyplaced-payments
```

Add the DNS **A** / **AAAA** (or CNAME) records Fly prints for `api.surelyplaced.com`.

### 5. Deploy

From the `server` directory:

```powershell
cd server
fly deploy --app surelyplaced-payments --ha=false
```

`fly.toml` keeps `min_machines_running = 1` so the API does not fully sleep between requests.

### 6. Verify

```powershell
fly status --app surelyplaced-payments
fly logs --app surelyplaced-payments
curl https://api.surelyplaced.com/health
```

| URL | Role |
|-----|------|
| `https://api.surelyplaced.com` | Custom API host |
| `https://surelyplaced-payments.fly.dev` | Default Fly URL |

Point PayPal live webhooks at:

`https://api.surelyplaced.com/api/webhooks/paypal`

### 7. Frontend env (Vercel)

On the Next.js app (`surely-placed-fe`), set:

```env
NEXT_PUBLIC_PAYMENTS_API_URL=https://api.surelyplaced.com
PAYMENTS_API_URL=https://api.surelyplaced.com
```

See [`../surely-placed-fe/README.md`](../surely-placed-fe/README.md) for full Vercel setup.

### Useful Fly commands

```powershell
fly deploy --app surelyplaced-payments --ha=false
fly logs --app surelyplaced-payments
fly ssh console --app surelyplaced-payments
fly secrets unset SOME_KEY --app surelyplaced-payments
fly scale count 1 --app surelyplaced-payments
```

## Project layout

```
server/
├── src/               # Express app, routes, services
├── migrations/        # Knex migrations
├── scripts/           # Schema ensure, Apps Script helper
├── Dockerfile         # Production image
├── fly.toml           # Fly app config
└── knexfile.js
```

## Related

- Frontend (Vercel): [`../surely-placed-fe/README.md`](../surely-placed-fe/README.md)
- Site: `https://www.surelyplaced.com`
- API: `https://api.surelyplaced.com`
