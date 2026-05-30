# Deploy SureCv (surecv.in)

## Architecture

| Service | Host | Purpose |
|---------|------|---------|
| Frontend | **https://surecv.in** (Vercel) | React app |
| API | **https://api.surecv.in** (Railway) | NVIDIA NIM proxy (`server/`) |

---

## 1. Railway (backend API)

1. [Railway](https://railway.app) → **New Project** → deploy from GitHub.
2. Set **Root Directory** to `server` (recommended).
3. **Variables** (Settings → Variables):

   | Variable | Value |
   |----------|--------|
   | `NVIDIA_API_KEY` | `nvapi-...` (your key) |
   | `FRONTEND_URL` | `https://surecv.in` |
   | `NODE_ENV` | `production` |

   `PORT` is set automatically by Railway.

4. **Networking** → generate domain → add custom domain **`api.surecv.in`**.
5. DNS (at your registrar):

   ```
   CNAME  api  →  <your-service>.up.railway.app
   ```

6. Verify: `https://api.surecv.in/health`  
   → `{"status":"ok","service":"SureCv API","nvidia":"connected",...}`

---

## 2. Vercel (frontend — surecv.in)

1. Import repo on [Vercel](https://vercel.com).
2. Framework: **Vite**, build: `npm run build`, output: `dist`.
3. **Environment variables**:

   | Variable | Value |
   |----------|--------|
   | `VITE_API_URL` | `https://api.surecv.in` |
   | `VITE_FIREBASE_*` | (from Firebase console) |
   | `VITE_RAZORPAY_KEY_ID` | (public key only) |

4. Add domains **`surecv.in`** and **`www.surecv.in`** in Vercel → point DNS to Vercel.
5. **Firebase Console** → Authentication → Authorized domains → add `surecv.in`, `www.surecv.in`.

---

## 3. Local development

```bash
# Terminal 1 — API
cd server && npm install && npm start

# Terminal 2 — frontend
npm install && npm run dev
```

`.env`: `VITE_API_URL=http://localhost:3001`

---

## Troubleshooting

- **CORS error on surecv.in** → `FRONTEND_URL=https://surecv.in` on Railway; redeploy API.
- **502 from API** → check `NVIDIA_API_KEY` on Railway logs.
- **Frontend calls wrong host** → set `VITE_API_URL=https://api.surecv.in` on Vercel and redeploy.
