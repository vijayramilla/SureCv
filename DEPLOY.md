# SureCv — Railway only (surecv.in)

Everything runs on **one Railway project**: React site + API. No Vercel or other hosts.

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
