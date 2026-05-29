/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string
  // NVIDIA API Key for resume optimization
  readonly VITE_NVIDIA_API_KEY?: string
  // Groq API Key for resume optimization (fallback)
  readonly VITE_GROQ_API_KEY?: string
  readonly VITE_GROQ_API_KEY_SECONDARY?: string
  // Gemini API Key (final fallback)
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_GEMINI_MODEL?: string
  // Razorpay Payment Keys
  readonly VITE_RAZORPAY_KEY_ID?: string
  // NOTE: RAZORPAY_SECRET_KEY must NEVER have VITE_ prefix (server-side only)
  // OpenAI API Key (if used)
  readonly VITE_OPENAI_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
