# Netlify Production Deployment Checklist

## Issue Found
Your deployment on Netlify is failing because:
1. ✗ Environment variables not set on Netlify
2. ✗ NVIDIA API key missing → CORS errors
3. ✗ Groq API key missing → Falls through to unavailable fallbacks

## Fix Required (Netlify Dashboard)

**Step 1: Add Environment Variables**
1. Go to your Netlify site → Site settings
2. Click "Build & deploy" → "Environment"
3. Click "Edit variables"
4. Add these environment variables:

```
VITE_NVIDIA_API_KEY = nvapi-your-key-from-nvidia
VITE_GROQ_API_KEY = gsk_your-key-from-groq
```

**Step 2: Deploy**
- Push code to your GitHub repo (main branch)
- Netlify will auto-trigger a deploy with new env vars
- Watch the deployment in Netlify dashboard

**Step 3: Verify**
- After deploy completes, test the Optimize button
- Open browser F12 console
- Should see: `[Optimize] NVIDIA NIM succeeded` or `[Optimize] Groq fallback succeeded`
- Should NOT see CORS errors or "not configured" errors

## What's Fixed in Code

✓ NVIDIA_BASE_URL now uses proxy in dev, direct API in production
✓ All API calls now include `credentials: 'include'` for CORS
✓ Error handling optimized for production environment
✓ Fallback chain properly prioritized: NVIDIA → Groq → Gemini

## Getting API Keys

1. **NVIDIA API Key**: https://build.nvidia.com/nvidia/chatqa
   - Sign up → Create an API Key → Copy (starts with nvapi-)

2. **Groq API Key**: https://console.groq.com/
   - Sign up → API Keys → Create Key → Copy (starts with gsk_)

Both are FREE tier - no credit card required!
