import { doc, updateDoc } from 'firebase/firestore'
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

export const calculateUsagePercentage = (used: number, total: number): number => {
  if (total === 0) return 0
  return (used / total) * 100
}
