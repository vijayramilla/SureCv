import { useEffect, useState } from 'react'
import { doc, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

interface UserProfile {
  uid: string
  name: string
  email: string
  photo: string | null
  plan: 'free' | 'starter' | 'power'
  optimizationsLeft: number
  optimizationsUsed: number
  totalOptimizationsAllTime: number
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

export function useUserProfile(uid: string | null | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) {
      setProfile(null)
      setLoading(false)
      return
    }

    setLoading(true)

    // Real-time listener — updates instantly when Firestore data changes
    const unsubscribe = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile)
          setError(null)
        } else {
          setProfile(null)
          setError('User profile not found')
        }
        setLoading(false)
      },
      (err) => {
        console.error('Error listening to user profile:', err)
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [uid])

  return { profile, loading, error }
}
