import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCRR5Xt8U-9dVxqsc_z0G_YjTtUk3e8VdU",
  authDomain: "surecv-24fe0.firebaseapp.com", // Use Firebase-hosted domain for auth
  projectId: "surecv-24fe0",
  storageBucket: "surecv-24fe0.firebasestorage.app",
  messagingSenderId: "602291926106",
  appId: "1:602291926106:web:63537efdb061eb23955463",
  measurementId: "G-LE546SQ8TP",
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
)

if (!isFirebaseConfigured) {
  console.warn(
    'Firebase is not configured. Add VITE_FIREBASE_* variables to a .env file. Auth and cloud sync are disabled until then.'
  )
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// Configure Google Auth Provider for better mobile sign-in and domain support
googleProvider.setCustomParameters({ 
  prompt: 'select_account',
  // Redirect back to current domain after auth
  redirect_uri: typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/callback` 
    : undefined
})
googleProvider.addScope('profile')
googleProvider.addScope('email')

// Analytics (browser only; measurementId is optional)
export let analytics: ReturnType<typeof getAnalytics> | null = null
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app)
    }
  })
}

// CRITICAL: browserLocalPersistence = stays logged in
// even after browser closes — like HireRaft does
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.error('Failed to set persistence:', err)
})

export default app
