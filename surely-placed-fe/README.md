# Surely Placed — Frontend

Next.js 15 (App Router) marketing site and product UI for [Surely Placed](https://www.surelyplaced.com). Deployed on **Vercel**. Talks to the payments API in `../server` (Fly.io) for webinar checkout.

## Stack

- **Next.js 15** + React 19
- **Redux Toolkit** + redux-persist
- **MUI**, Sass, Framer Motion
- PayPal Buttons (webinar) via payments API
- Stripe (cohort checkout) via main API

## Quick start (local)

```powershell
cd surely-placed-fe
cp .env.local.example .env.local
# Edit .env.local — see Environment below

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For webinar PayPal checkout, also run the payments API locally (`../server` on port `8080`).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Environment

Copy `.env.local.example` → `.env.local` for local work. Set the same keys in the **Vercel project → Settings → Environment Variables**.

### Payments API (webinar checkout)

| Variable | Local | Production |
|----------|-------|------------|
| `NEXT_PUBLIC_PAYMENTS_API_URL` | `http://localhost:8080` | `https://api.surelyplaced.com` |
| `PAYMENTS_API_URL` | `http://localhost:8080` | `https://api.surelyplaced.com` |

`NEXT_PUBLIC_*` is used in the browser; `PAYMENTS_API_URL` is used by Next.js server routes (e.g. webhook proxy).

### Main product API / auth / billing

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Main backend base URL (cohorts, users, etc.) |
| `NEXT_PUBLIC_AUTH_API_URL` | Auth / refresh-token base URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (cohort checkout) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |

### Analytics / SEO (optional)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager container ID |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console meta tag |

## Useful routes

| Path | Notes |
|------|-------|
| `/` | Marketing home |
| `/webinar` | Webinar landing + PayPal checkout |
| `/webinar/join` | Join flow after registration |
| `/cohorts` | Cohorts listing |
| `/sp-webinar-ops` | Hidden webinar ops admin UI |

Admin login credentials are configured on the **payments server** (`WEBINAR_ADMIN_EMAIL` / `WEBINAR_ADMIN_PASSWORD`), not in this app.

## Deploy on Vercel

### 1. Prerequisites

- Vercel account and [Vercel CLI](https://vercel.com/docs/cli) (optional): `npm i -g vercel`
- Payments API live on Fly.io (`https://api.surelyplaced.com`) — see `../server/README.md`
- Custom domain ready: `www.surelyplaced.com` (apex `surelyplaced.com` redirects to `www` via `next.config.mjs`)

### 2. Import the project

**Dashboard**

1. [New Project](https://vercel.com/new) → import this Git repo
2. **Root Directory:** `surely-placed-fe`
3. Framework: **Next.js** (auto-detected)
4. Build command: `npm run build` (default)
5. Output: Next.js default (no change)

**CLI**

```powershell
cd surely-placed-fe
vercel
# Production:
vercel --prod
```

### 3. Environment variables (Vercel)

Set for **Production** (and Preview if you use preview APIs):

```env
NEXT_PUBLIC_PAYMENTS_API_URL=https://api.surelyplaced.com
PAYMENTS_API_URL=https://api.surelyplaced.com

NEXT_PUBLIC_API_BASE_URL=https://your-main-api.example.com
NEXT_PUBLIC_AUTH_API_URL=https://your-auth-api.example.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=....apps.googleusercontent.com

NEXT_PUBLIC_GTM_ID=GTM-XXXX
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
```

Redeploy after changing env vars so `NEXT_PUBLIC_*` values are baked into the client bundle.

### 4. Domains

1. Vercel → Project → **Settings → Domains**
2. Add `www.surelyplaced.com` and `surelyplaced.com`
3. Point DNS as Vercel instructs (usually CNAME for `www`, A/ALIAS for apex)

`next.config.mjs` permanently redirects bare `surelyplaced.com` → `https://www.surelyplaced.com`.

### 5. CORS / backend allowlist

On the Fly payments app, ensure:

```env
FRONTEND_ORIGIN=https://www.surelyplaced.com
SITE_URL=https://www.surelyplaced.com
```

CSP in `next.config.mjs` already allows `https://api.surelyplaced.com` and `https://surelyplaced-payments.fly.dev` in `connect-src`.

### 6. Verify

- Site: `https://www.surelyplaced.com`
- Webinar checkout loads PayPal config from the payments API
- `/health` on the API returns OK: `https://api.surelyplaced.com/health`

## Project layout

```
surely-placed-fe/
├── src/app/           # App Router pages & API routes
├── src/components/    # UI
├── src/lib/           # Client helpers (e.g. payments)
├── src/services/      # Axios / API clients
├── src/store/         # Redux
├── public/            # Static assets
├── styles/            # Global / Sass
├── theme/             # MUI theme
└── next.config.mjs    # CSP, host redirects
```

## Related

- Payments backend (Fly.io): [`../server/README.md`](../server/README.md)
- Public site: `https://www.surelyplaced.com`
- Payments API: `https://api.surelyplaced.com`
