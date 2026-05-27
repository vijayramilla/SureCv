import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, updateDoc, getDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore'
import { auth, db, googleProvider, isFirebaseConfigured } from '../lib/firebase'
import {
  generateReferralCode,
  getFirstDayNextMonth,
  checkAndResetCredits,
} from '../lib/userUtils'

interface User {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
}

interface UserProfile {
  uid: string
  name: string
  email: string
  photo: string | null
  plan: 'free' | 'starter' | 'power'
  optimizationsLeft: number
  optimizationsUsed: number
  totalOptimizationsAllTime: number
  resumesCreated: number
  planActivatedAt: Timestamp | null
  planExpiresAt: Timestamp | null
  nextResetDate: Timestamp
  referralCode: string
  referredBy: string | null
  referralCount: number
  bonusOptimizations: number
  createdAt: Timestamp
  lastLoginAt: Timestamp
  lastSeenAt: Timestamp
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch or create user profile in Firestore
  const fetchOrCreateProfile = async (firebaseUser: any) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        // Existing user: update lastLoginAt and check for credit reset
        const profile = userDocSnap.data() as UserProfile
        await checkAndResetCredits(firebaseUser.uid, profile)

        // Update lastLoginAt
        await updateDoc(userDocRef, {
          lastLoginAt: serverTimestamp(),
          lastSeenAt: serverTimestamp(),
        })

        // Fetch updated profile
        const updatedSnap = await getDoc(userDocRef)
        setUserProfile(updatedSnap.data() as UserProfile)
      } else {
        // New user: create profile with free plan
        const newProfile: Partial<UserProfile> = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          photo: firebaseUser.photoURL || null,
          plan: 'free',
          optimizationsLeft: 2,
          optimizationsUsed: 0,
          totalOptimizationsAllTime: 0,
          resumesCreated: 0,
          planActivatedAt: serverTimestamp(),
          planExpiresAt: null,
          nextResetDate: serverTimestamp() as any as Timestamp, // Will be set to first day of next month
          referralCode: generateReferralCode(firebaseUser.uid),
          referredBy: null,
          referralCount: 0,
          bonusOptimizations: 0,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          lastSeenAt: serverTimestamp(),
        }

        // Calculate nextResetDate as first day of next month
        const nextReset = getFirstDayNextMonth()
        newProfile.nextResetDate = Timestamp.fromDate(nextReset)

        await setDoc(userDocRef, newProfile)
        setUserProfile(newProfile as UserProfile)
      }
    } catch (error) {
      console.error('Error fetching/creating user profile:', error)
    }
  }

  const refreshProfile = async () => {
    if (!user) return
    try {
      const userDocRef = doc(db, 'users', user.uid)
      const userDocSnap = await getDoc(userDocRef)
      if (userDocSnap.exists()) {
        setUserProfile(userDocSnap.data() as UserProfile)
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  useEffect(() => {
    const loadingTimeout = window.setTimeout(() => {
      setLoading(false)
    }, 3000)

    if (!isFirebaseConfigured) {
      setLoading(false)
      return () => clearTimeout(loadingTimeout)
    }

    let unsubscribeFirestore: (() => void) | undefined

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeFirestore?.()
      unsubscribeFirestore = undefined

      try {
        if (firebaseUser) {
          const mappedUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL,
          }
          setUser(mappedUser)

          const userRef = doc(db, 'users', firebaseUser.uid)

          unsubscribeFirestore = onSnapshot(
            userRef,
            async (snap) => {
              if (snap.exists()) {
                const profile = snap.data() as UserProfile
                const creditsReset = await checkAndResetCredits(firebaseUser.uid, profile)

                if (creditsReset) {
                  const updatedSnap = await getDoc(userRef)
                  if (updatedSnap.exists()) {
                    setUserProfile(updatedSnap.data() as UserProfile)
                  }
                } else {
                  setUserProfile(profile)
                }
              } else {
                const newProfile: Partial<UserProfile> = {
                  uid: firebaseUser.uid,
                  name: firebaseUser.displayName || '',
                  email: firebaseUser.email || '',
                  photo: firebaseUser.photoURL || null,
                  plan: 'free',
                  optimizationsLeft: 2,
                  optimizationsUsed: 0,
                  totalOptimizationsAllTime: 0,
                  planActivatedAt: serverTimestamp(),
                  planExpiresAt: null,
                  nextResetDate: Timestamp.fromDate(getFirstDayNextMonth()),
                  referralCode: generateReferralCode(firebaseUser.uid),
                  referredBy: null,
                  referralCount: 0,
                  bonusOptimizations: 0,
                  createdAt: serverTimestamp(),
                  lastLoginAt: serverTimestamp(),
                  lastSeenAt: serverTimestamp(),
                }

                await setDoc(userRef, newProfile)
                setUserProfile(newProfile as UserProfile)
              }
              setLoading(false)
            },
            (error) => {
              console.error('Error listening to user profile:', error)
              setLoading(false)
            }
          )
        } else {
          setUser(null)
          setUserProfile(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(loadingTimeout)
      unsubscribeFirestore?.()
      unsubscribeAuth()
    }
  }, [])

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      throw new Error(
        'Firebase is not configured. Copy .env.example to .env and add your VITE_FIREBASE_* keys.'
      )
    }

    setLoading(true)
    try {
      console.log('🔐 Initiating Google Sign-In...')
      const result = await signInWithPopup(auth, googleProvider)
      console.log('✅ Google Sign-In popup successful')
      
      const mappedUser: User = {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL,
      }
      setUser(mappedUser)
      console.log('✅ User state updated:', mappedUser.email)
      
      await fetchOrCreateProfile(result.user)
      console.log('✅ Profile fetched/created')
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error)
      console.error('Error code:', error?.code)
      console.error('Error message:', error?.message)
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in popup was closed. Please try again.')
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Multiple sign-in popups detected. Please try again.')
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.')
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Google Sign-In. Please contact support.')
      } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
        throw new Error('Google Sign-In is not supported in this environment. Try a different browser.')
      } else if (error.code === 'auth/invalid-api-key') {
        throw new Error('Firebase configuration error. Please contact support.')
      }
      throw new Error(error?.message || 'Sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const logOut = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
      setUserProfile(null)
      console.log('✅ User signed out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      setUser(null)
      setUserProfile(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, logOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
