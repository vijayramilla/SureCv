/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string
  // Frontend fallback for local dev (Groq when Netlify Functions unavailable)
  readonly VITE_GROQ_API_KEY?: string
  readonly VITE_RAZORPAY_KEY_ID?: string
  // DEPRECATED: NVIDIA API keys no longer exposed to frontend
  // All NVIDIA/AI calls now securely handled by Netlify Functions backend
  readonly VITE_NVIDIA_API_KEY?: string
  readonly VITE_GROQ_API_KEY_SECONDARY?: string
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_GEMINI_MODEL?: string
  readonly VITE_OPENAI_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
