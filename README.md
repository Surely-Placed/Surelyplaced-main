# Surely Placed

Monorepo for [Surely Placed](https://www.surelyplaced.com): Next.js frontend and Express payments API.

| Folder | Role | Host |
|--------|------|------|
| [`surely-placed-fe/`](surely-placed-fe/) | Marketing site, cohorts, webinar UI | **Vercel** → `https://www.surelyplaced.com` |
| [`server/`](server/) | PayPal webinar checkout, Zoom, email, Sheets | **Fly.io** → `https://api.surelyplaced.com` |

---

## Local development

### 1. Payments API

```powershell
cd server
# Configure .env.development (Postgres + PayPal sandbox, etc.)
npm install
npm run migrate:latest
npm run dev
```

Health: [http://localhost:8080/health](http://localhost:8080/health)

### 2. Frontend

```powershell
cd surely-placed-fe
cp .env.local.example .env.local
# Point payments URL at local API (see below)
npm install
npm run dev
```

Site: [http://localhost:3000](http://localhost:3000)

**Frontend `.env.local` (payments):**

```env
NEXT_PUBLIC_PAYMENTS_API_URL=http://localhost:8080
PAYMENTS_API_URL=http://localhost:8080
```

Also set main product vars as needed (`NEXT_PUBLIC_API_BASE_URL`, Stripe, Google OAuth, etc.). Full lists live in each folder’s README.

---

## Deploy: backend on Fly.io

App: `surelyplaced-payments` · config: [`server/fly.toml`](server/fly.toml) · image: [`server/Dockerfile`](server/Dockerfile)

```powershell
fly auth login

# First time only
fly apps create surelyplaced-payments --org <your-org>

cd server

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
  SMTP_USER="xxx" `
  SMTP_APP_PASSWORD="xxx" `
  CONTACT_TO_EMAIL="xxx" `
  CONTACT_FROM_EMAIL="xxx" `
  ZOOM_ACCOUNT_ID="xxx" `
  ZOOM_CLIENT_ID="xxx" `
  ZOOM_CLIENT_SECRET="xxx" `
  WEBINAR_ADMIN_EMAIL="xxx" `
  WEBINAR_ADMIN_PASSWORD="xxx" `
  --app surelyplaced-payments

fly certs add api.surelyplaced.com --app surelyplaced-payments
# Add DNS A/AAAA (or CNAME) from: fly certs show api.surelyplaced.com

fly deploy --app surelyplaced-payments --ha=false
```

Verify: `curl https://api.surelyplaced.com/health`  
Fallback URL: `https://surelyplaced-payments.fly.dev`

PayPal webhook URL: `https://api.surelyplaced.com/api/webhooks/paypal`

More detail: [`server/README.md`](server/README.md)

---

## Deploy: frontend on Vercel

1. Import this repo in [Vercel](https://vercel.com/new)
2. **Root Directory:** `surely-placed-fe`
3. Framework: Next.js (default build)
4. Set environment variables (Production):

```env
NEXT_PUBLIC_PAYMENTS_API_URL=https://api.surelyplaced.com
PAYMENTS_API_URL=https://api.surelyplaced.com

NEXT_PUBLIC_API_BASE_URL=https://your-main-api.example.com
NEXT_PUBLIC_AUTH_API_URL=https://your-auth-api.example.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=....apps.googleusercontent.com
NEXT_PUBLIC_GTM_ID=GTM-XXXX
```

5. Domains: `www.surelyplaced.com` and `surelyplaced.com` (apex redirects to `www` via `next.config.mjs`)
6. Redeploy after changing any `NEXT_PUBLIC_*` variable

Or CLI:

```powershell
cd surely-placed-fe
vercel --prod
```

More detail: [`surely-placed-fe/README.md`](surely-placed-fe/README.md)

---

## Production checklist

- [ ] Fly secrets set; `/health` OK on `api.surelyplaced.com`
- [ ] PayPal live webhook + `PAYPAL_WEBHOOK_ID` match Fly
- [ ] Vercel env points at `https://api.surelyplaced.com`
- [ ] Fly `FRONTEND_ORIGIN` / `SITE_URL` = `https://www.surelyplaced.com`
- [ ] DNS: site → Vercel, `api` → Fly certs

---

## Docs

| Doc | Contents |
|-----|----------|
| [`server/README.md`](server/README.md) | API routes, migrations, PayPal/Zoom/Sheets, Fly commands |
| [`surely-placed-fe/README.md`](surely-placed-fe/README.md) | Routes, env vars, Vercel domains/CSP |
