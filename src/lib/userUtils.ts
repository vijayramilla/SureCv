import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import { PLAN_OPTIMIZATION_LIMITS } from '../constants/plans'

export const generateReferralCode = (uid: string): string => {
  // Generate unique referral code: first 4 chars of uid + random suffix
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${uid.substring(0, 4)}${suffix}`
}

export const getFirstDayNextMonth = (): Date => {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

export const checkAndResetCredits = async (
  uid: string,
  profile: any
): Promise<boolean> => {
  if (!profile) return false

  // Free plan never resets (one-time 2 optimizations)
  if (profile.plan === 'free') {
    return false
  }

  const now = new Date()
  const resetDate = profile.nextResetDate?.toDate?.() || new Date(profile.nextResetDate)

  if (resetDate && now >= resetDate) {
    // Reset credits based on plan (only for paid plans)
    const credits: Record<string, number> = {
      starter: PLAN_OPTIMIZATION_LIMITS.starter,
      power: PLAN_OPTIMIZATION_LIMITS.power,
    }

    try {
      await updateDoc(doc(db, 'users', uid), {
        optimizationsLeft: credits[profile.plan] || 2,
        optimizationsUsed: 0,
        nextResetDate: getFirstDayNextMonth(),
      })
      return true
    } catch (error) {
      console.error('Error resetting credits:', error)
      return false
    }
  }

  return false
}

export const calculateDaysUntilReset = (nextResetDate: any): number => {
  const resetDate = nextResetDate?.toDate?.() || new Date(nextResetDate)
  const now = new Date()
  const diffTime = resetDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export const calculateDaysUntilExpiry = (planExpiresAt: any): number => {
  if (!planExpiresAt) return 0
  const expiryDate = planExpiresAt?.toDate?.() || new Date(planExpiresAt)
  const now = new Date()
  const diffTime = expiryDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export const formatFirestoreDate = (timestamp: any): string => {
  if (!timestamp) return 'N/A'
  
  try {
    // Try to convert Firestore Timestamp to Date
    let date: Date
    
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      // It's a Firestore Timestamp
      date = timestamp.toDate()
    } else if (timestamp instanceof Date) {
      // It's already a Date
      date = timestamp
    } else if (typeof timestamp === 'number') {
      // It's a timestamp number
      date = new Date(timestamp)
    } else if (typeof timestamp === 'string') {
      // It's a date string
      date = new Date(timestamp)
    } else {
      return 'N/A'
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A'
    }
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'N/A'
  }
}

export const verifyAndCorrectPowerPlanExpiry = async (
  uid: string,
  profile: any
): Promise<boolean> => {
  if (!profile || profile.plan !== 'power') return false

  const daysLeft = calculateDaysUntilExpiry(profile.planExpiresAt)
  
  // If Power plan has less than 350 days left or no expiry, recalculate for 365 days
  if (daysLeft < 350 || !profile.planExpiresAt) {
    console.log(`🔧 Correcting Power plan expiry (currently ${daysLeft} days left)`)
    
    const newExpiryDate = new Date()
    newExpiryDate.setTime(newExpiryDate.getTime() + 365 * 24 * 60 * 60 * 1000)
    
    try {
      await updateDoc(doc(db, 'users', uid), {
        planExpiresAt: Timestamp.fromDate(newExpiryDate),
      })
      console.log(`✅ Power plan expiry corrected to 365 days`)
      return true
    } catch (error) {
      console.error('Error correcting power plan expiry:', error)
      return false
    }
  }

  return false
}

export const calculateUsagePercentage = (used: number, total: number): number => {
  if (total === 0) return 0
  return (used / total) * 100
}
