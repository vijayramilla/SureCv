# SureCv Netlify Functions Backend Architecture

## Overview

SureCv now uses a **secure Netlify Functions backend** for all AI API calls. This eliminates CORS issues, protects API keys, and ensures production stability.

### Architecture Flow

```
Frontend (React)
    ↓
    ↓ calls /.netlify/functions/optimize
    ↓
Backend (netlify/functions/optimize.js)
    ↓ (backend-only API key)
    ↓
NVIDIA NIM API (meta/llama-3.3-70b-instruct)
    ↓
Backend returns optimized resume JSON
    ↓
Frontend displays results
```

## Files Changed

### New Files
- `netlify/functions/optimize.js` - Main backend optimization function
- `netlify.toml` - Netlify configuration for deployment

### Updated Files
- `src/lib/nvidia-nim.ts` - Now calls backend instead of NVIDIA directly
- `src/vite-env.d.ts` - Marked AI keys as deprecated (frontend no longer needs them)
- `.env` - Removed `VITE_NVIDIA_API_KEY` exposure

### Removed Direct Calls
- ❌ Frontend no longer calls `https://integrate.api.nvidia.com`
- ❌ Frontend no longer uses `VITE_NVIDIA_API_KEY`
- ❌ No more localhost:8787 backend requests

## Setup for Production Deployment

### Step 1: Connect Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Select branch: `main` or `master`
5. Click "Deploy site"

### Step 2: Set Backend Environment Variables

In Netlify Dashboard → Your Site → Settings → Build & Deploy → Environment:

Add these **backend-only** variables (NEVER prefix with VITE_):

```
NVIDIA_API_KEY=nvapi-[your-key-from-build.nvidia.com]
```

That's it! Netlify Functions will automatically use this for the backend.

### Step 3: Verify Deployment

After deploy completes:

1. Go to https://surecv.in
2. Try the resume optimizer
3. Check browser console for logs: `[Frontend] Calling backend for optimization...`
4. If successful: Resume optimization completes without CORS errors ✅

## Local Development (Optional)

### Option A: Deploy to Netlify (Recommended)
Just deploy - Netlify Functions work in production immediately.

### Option B: Test Locally with Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Start local dev server with Functions support
netlify dev
```

Netlify CLI will:
- Start Vite dev server on localhost:3000
- Start Functions server on localhost:8888
- Route `/.netlify/functions/optimize` to local backend
- Use environment variables from Netlify (if linked)

## How It Works

### Frontend (src/lib/nvidia-nim.ts)
```typescript
export async function analyzeResume(...) {
  const response = await fetch('/.netlify/functions/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, jobDescription, ... })
  })
  return await response.json()
}
```

### Backend (netlify/functions/optimize.js)
```javascript
exports.handler = async (event, context) => {
  // Validates input
  // Calls NVIDIA API using process.env.NVIDIA_API_KEY
  // Returns optimized resume JSON
  // NVIDIA key is never exposed to frontend
}
```

## Environment Variables

### Frontend (Safe - All Public)
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_RAZORPAY_KEY_ID=...
```

### Backend (Secure - Protected by Netlify)
```
NVIDIA_API_KEY=nvapi-...  (only set on Netlify, not in .env or source code)
```

The backend environment variables are:
- ✅ Set on Netlify Dashboard only
- ✅ Never committed to Git
- ✅ Never exposed to browser
- ✅ Only accessible in netlify/functions/

## Troubleshooting

### Error: "Backend error 500"
- Check Netlify build logs: Dashboard → Deploys → Latest → Deploy Log
- Verify NVIDIA_API_KEY is set correctly (no typos, valid format: `nvapi-...`)
- Check Function logs: Dashboard → Functions → optimize

### Error: "/.netlify/functions/optimize not found"
- Netlify deploy might still be in progress
- Try: Dashboard → Deploys → Trigger new deploy
- Or: Wait 5 minutes and refresh

### CORS Still Failing
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh page (Ctrl+Shift+R)
- Check browser console for actual error message

### Build Failing
- Run locally: `npm run build`
- Check for TypeScript errors: `npm run typecheck`
- Verify all dependencies: `npm install`

## Production Checklist

- [x] Backend function created: `netlify/functions/optimize.js`
- [x] Frontend calls backend: `src/lib/nvidia-nim.ts`
- [x] No frontend direct NVIDIA calls
- [x] No API key exposure in frontend
- [x] CORS headers configured: `netlify.toml`
- [x] Environment variables documented
- [ ] **Set NVIDIA_API_KEY on Netlify Dashboard** ← DO THIS
- [ ] Deploy to Netlify
- [ ] Test optimization on https://surecv.in
- [ ] Verify no browser CORS errors

## Key Benefits

✅ **Secure**: API keys never exposed to browser  
✅ **Fast**: Backend runs serverless, scales automatically  
✅ **Reliable**: Netlify Functions have 99.99% uptime  
✅ **CORS-Free**: No more CORS errors blocking optimization  
✅ **Production-Ready**: Works immediately on surecv.in  

## Support

If you encounter issues:

1. **Check Netlify Function logs**:
   - Dashboard → Your Site → Functions → optimize → Recent logs

2. **Check build logs**:
   - Dashboard → Your Site → Deploys → Latest deploy → Deploy Log

3. **Verify env vars**:
   - Dashboard → Your Site → Settings → Build & Deploy → Environment
   - Confirm NVIDIA_API_KEY is there and not truncated

4. **Test locally**:
   ```bash
   npm run build
   npm install -g netlify-cli
   netlify dev
   # Open http://localhost:3000
   ```

---

**Last Updated**: May 2026  
**Architecture**: Netlify Functions + NVIDIA NIM LLM  
**Production URL**: https://surecv.in
