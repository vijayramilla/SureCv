# SureCv — Vercel (static + serverless API) or Railway

## Option A — Vercel (current direction)

Architecture: Vite SPA served from `dist/`, AI endpoints run as **Vercel serverless functions** (`api/optimize.js`, `api/cover-letter.js`). The puppeteer scraper (`server/scraper.mjs`) does **not** run on Vercel — the frontend falls back to jsPDF, client-side PDF text extraction, and `computeFallbackAtsScore`.

### One-time setup

1. Create an **account token** at https://vercel.com/account/settings/tokens (scope: Full Account). Note: `vck_...` keys are **AI Gateway keys** — they cannot deploy.
2. Push env vars (reads local `.env`, never prints secrets):

   ```bash
   VERCEL_TOKEN=<token> bash scripts/vercel-push-env.sh surecv
   ```

   Sets `NVIDIA_API_KEY`, all `VITE_FIREBASE_*`, `VITE_RAZORPAY_KEY_ID`, and `PUPPETEER_SKIP_DOWNLOAD=1`. `VITE_API_URL`/`VITE_SCRAPER_API_URL` stay unset (same-origin + fallbacks).

3. Deploy:

   ```bash
   npx vercel link --yes --project surecv --token=<token>
   npx vercel deploy --prod --token=<token>
   ```

4. Attach domains (DNS already points at Vercel; CNAME `5390eeaa57191e8e.vercel-dns-017.com`):

   ```bash
   npx vercel domains add surecv.in surecv --token=<token>
   npx vercel domains add www.surecv.in surecv --token=<token>
   npx vercel alias set <deployment-url> surecv.in --token=<token>
   npx vercel alias set <deployment-url> www.surecv.in --token=<token>
   ```

   If a domain is "already in use", it is claimed by another Vercel account/project — remove it there first.

### Deploy checklist

- `vercel.json`: SPA fallback rewrite excludes `/api/*`; functions get `maxDuration: 60`
- `api/optimize.js` + `api/cover-letter.js` respond same-origin — no CORS needed in prod
- Model: `NVIDIA_MODEL` env var, default `meta/llama-3.2-11b-vision-instruct` (the old `meta/llama-3.3-70b-instruct` went EOL 2026-08-26 → 410). To pick another: `node --env-file=.env scripts/compare-nvidia-models.mjs <model-id>`
- Verify: `node --env-file=.env scripts/smoke-vercel-functions.mjs`, then live checks below

## Option B — Railway (previous setup)

Everything runs on **one Railway project**: React site + API.

---

## Railway setup

| Setting | Value |
|---------|--------|
| **Root Directory** | *(empty — repository root)* |
| **Build Command** | `npm install && npm run build && cd server && npm install` |
| **Start Command** | `node server/index.js` |

Custom domains: **surecv.in**, **www.surecv.in**

---

## Environment variables

Copy from **`railway.env.example`**.

### Secret (server only — no `VITE_` prefix)

| Variable | Purpose |
|----------|---------|
| `NVIDIA_API_KEY` | NVIDIA NIM (resume + cover letter) |
| `RAZORPAY_SECRET_KEY` | Payment verification (if used server-side) |
| `FRONTEND_URL` | `https://surecv.in` (CORS) |
| `NODE_ENV` | `production` |

### Public (safe in frontend build)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | `https://surecv.in` |
| `VITE_FIREBASE_*` | Firebase web config |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key |

### Never add on Railway

These get embedded in the JavaScript sent to every visitor:

- `VITE_NVIDIA_API_KEY` ❌  
- `VITE_GEMINI_API_KEY` ❌  
- `VITE_GROQ_API_KEY` ❌  
- `GEMINI_API_KEY` without server-only handling ❌  

AI calls go through **`/api/optimize`** on your server; the browser never sees NVIDIA keys.

---

## Security

1. **`.env` is gitignored** — only set variables in Railway dashboard.  
2. **Rotate keys** if they were ever committed or shared in chat.  
3. **Firebase**: restrict API key to your domains in Google Cloud Console.  
4. After deploy, open DevTools → Sources → search built JS for `nvapi-` or `gsk_` — should find **nothing**.

---

## Verify deploy

Logs:

```text
📦 Frontend: serving /dist
✅ SureCv API running on 0.0.0.0:...
```

URLs:

- https://surecv.in — homepage  
- https://surecv.in/health — `{"status":"ok","nvidia":"connected"}`  
- https://surecv.in/optimize — optimizer  

Firebase → Authentication → Authorized domains → `surecv.in`, `www.surecv.in`

---

## DNS

```
CNAME  @    →  <your-service>.up.railway.app
CNAME  www  →  <your-service>.up.railway.app
```
